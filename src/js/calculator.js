'use strict';

// ========== 核心计算逻辑 ==========
// 依赖 species-db.js 中的 ForestCalc.SPECIES

var ForestCalc = window.ForestCalc || {};

// 二元立木材积公式: V = a × D^b × H^c
// 变指数模型: V = a × D^(b1+b2(D+H)) × H^(c1+c2(D+H))
ForestCalc.calcVolume = function(s, dbh, height) {
  if (!isFinite(dbh) || !isFinite(height) || dbh <= 0 || height <= 0) return 0;
  if (s.a === 0) return null;
  if (s.isDynamic && s.b1 !== undefined) {
    var dh = dbh + height;
    return s.a * Math.pow(dbh, s.b1 + s.b2 * dh) * Math.pow(height, s.c1 + s.c2 * dh);
  }
  return s.a * Math.pow(dbh, s.b) * Math.pow(height, s.c);
};

// 动态出材率 = f(D, H, speciesGroup)
// 每树种独立基准经济材率(econBasePct)，D/H敏感性参照DB51/T 1466马尾松验证斜率
// 斜率: +0.18%/cm DBH, +0.34%/m Height (153点回归 R²=0.977)
ForestCalc.calcYield = function(s, volume, dbh, height) {
  var d = dbh || 20, h = height || 15;

  // 树种基准经济材率（规格材+非规格材合计，D=20 H=15 时）
  var econBase = (s.econBasePct !== undefined) ? s.econBasePct : 75;
  
  // D/H 调整（相对基准径级 D=20 H=15）
  var econPct = econBase + 0.18 * (d - 20) + 0.34 * (h - 15);
  // 宽松裁剪：下限 50%（极小径级/极弯干形），上限 92%（大径材上限）
  econPct = Math.max(50, Math.min(92, econPct));

  var econRate = econPct / 100;
  var specRatio = s.yieldRates.spec / (s.yieldRates.spec + s.yieldRates.nonSpec);
  var fuelRate = s.yieldRates.fuel;
  var wasteRate = Math.max(0, 1 - econRate - fuelRate);

  return {
    spec: volume * econRate * specRatio,
    nonSpec: volume * econRate * (1 - specRatio),
    fuel: volume * fuelRate,
    waste: volume * wasteRate,
    econRate: econRate,
    dynamic: true
  };
};

/**
 * 公顷蓄积量计算
 * @param {number} singleVol - 单株材积 (m³)
 * @param {object} yieldResult - 出材率结果对象 { spec, nonSpec, fuel, waste }
 * @param {number} density - 每公顷株数
 * @returns {{ totalVolume: number, totalSpec: number, totalNonSpec: number, totalFuel: number, totalWaste: number, density: number }}
 */
ForestCalc.calcPerHectare = function(singleVol, yieldResult, density) {
  density = Math.max(1, Math.min(10000, density || 0));
  return {
    totalVolume: singleVol * density,
    totalSpec: yieldResult.spec * density,
    totalNonSpec: yieldResult.nonSpec * density,
    totalFuel: yieldResult.fuel * density,
    totalWaste: yieldResult.waste * density,
    density: density
  };
};

/**
 * 亩蓄积量计算
 * @param {number} singleVol - 单株材积 (m³)
 * @param {Object} yieldResult - 出材率计算结果
 * @param {number} density - 每亩株数
 * @returns {{ totalVolume: number, totalSpec: number, totalNonSpec: number, totalFuel: number, totalWaste: number, density: number, perMu: boolean }}
 */
ForestCalc.calcPerMu = function(singleVol, yieldResult, density) {
  density = Math.max(1, Math.min(1000, density || 0));
  return {
    totalVolume: singleVol * density,
    totalSpec: yieldResult.spec * density,
    totalNonSpec: yieldResult.nonSpec * density,
    totalFuel: yieldResult.fuel * density,
    totalWaste: yieldResult.waste * density,
    density: density,
    perMu: true
  };
};

/**
 * 生成收方表（D从dMin到dMax，步长step，H自动估算为 D*ratio）
 */
ForestCalc.generateYieldTable = function(speciesId, dMin, dMax, step, hRatio) {
  dMin = Math.max(6, dMin || 6);
  dMax = Math.min(80, dMax || 60);
  step = step || 2;
  hRatio = hRatio || 0.75;

  var sp = ForestCalc.SPECIES.find(function(s) { return s.id === speciesId; });
  if (!sp) return null;

  var rows = [];
  for (var d = dMin; d <= dMax; d += step) {
    var h = +(d * hRatio).toFixed(1);
    var vol = ForestCalc.calcVolume(sp, d, h);
    if (vol === null) continue;
    var y = ForestCalc.calcYield(sp, vol, d, h);
    rows.push({
      dbh: d,
      height: h,
      volume: vol,
      specVol: y.spec,
      nonSpecVol: y.nonSpec,
      fuelVol: y.fuel,
      wasteVol: y.waste,
      econRate: y.econRate
    });
  }
  return { species: sp, rows: rows };
};

/**
 * 计算出材率分配（纯函数，不依赖 DOM）
 * @param {object} s - 树种对象
 * @param {number|null} customTotal - 用户自定义综合出材率（0~1），null 表示使用树种默认值
 * @returns {{ spec, nonSpec, fuel, waste, custom }}
 */
ForestCalc.calcYieldRates = function(s, customTotal) {
  if (customTotal !== null && customTotal > 0 && customTotal <= 1) {
    var def = s.yieldRates;
    var econSum = def.spec + def.nonSpec;
    var scale = econSum > 0 ? customTotal / econSum : 1;
    return {
      spec: def.spec * scale,
      nonSpec: def.nonSpec * scale,
      fuel: def.fuel,
      waste: Math.max(0, 1 - customTotal - def.fuel),
      custom: true
    };
  }
  return { spec: s.yieldRates.spec, nonSpec: s.yieldRates.nonSpec, fuel: s.yieldRates.fuel, waste: s.yieldRates.waste, custom: false };
};

// 获取出材率分配（支持用户自定义综合出材率）— 兼容旧接口，内部读取 DOM
ForestCalc.getYieldRates = function(s) {
  var yTotalEl = document.getElementById('yTotal');
  var customTotal = null;
  if (yTotalEl) {
    var val = parseFloat(yTotalEl.value);
    if (!isNaN(val) && val > 0 && val <= 1) customTotal = val;
  }
  return ForestCalc.calcYieldRates(s, customTotal);
};