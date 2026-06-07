'use strict';

// ========== 树种数据库 + 常量 + 工具函数 ==========
// 此文件必须最先加载，为所有后续模块提供基础数据

var ForestCalc = window.ForestCalc || {};

// ========== 树种数据库（多标准交叉验证） ==========
// 公式来源: DB51/T 1462~1467(四川), DB52/T 702~826(贵州), DB35/T 1823(福建),
//            DB53/T 1422(云南), LY208-77(部标), GB/T 4814-2013(原木检尺)
ForestCalc.SPECIES = [
  // ---- 四川 DB51 系列 ----
  {
    id: 'masson-pine', name: '马尾松(本地实际表)', latin: 'Pinus massoniana',
    a: 0.0000589718432, b: 1.879095, c: 0.975023, isDynamic: false,
    source: '本地实际使用材积表 回归(R²=0.992, n=150)', reliability: 'high',
    yieldRates: { spec: 0.6, nonSpec: 0.2, fuel: 0.05, waste: 0.15 }, // economic base 78%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 78,   // DB51/T 1466 153点回归 R²=0.977
    note: '⭐ 本地现用表！从用户提供的150个表值回归。D=20 H=15→0.230m³'
  },
  {
    id: 'masson-pine-db51', name: '马尾松(DB51标参)', latin: 'Pinus massoniana',
    a: 0.00006808595, b: 1.858728, c: 0.9721861, isDynamic: false,
    source: 'DB51/T 1466-2012 四川省标(已废止)', reliability: 'high',
    yieldRates: { spec: 0.6, nonSpec: 0.2, fuel: 0.05, waste: 0.15 }, // DB51验证:经济材80%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 80,   // DB51/T 1466
    note: 'DB51省标参考。D=20 H=15→0.248m³。与实际表偏差-7%'
  },
  {
    id: 'chinese-fir', name: '杉木', latin: 'Cunninghamia lanceolata',
    a: 0.000058777042, b: 1.9699831, c: 0.89646157, isDynamic: false,
    source: 'DB51/T 1464-2012/LY208-77', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.20, fuel: 0.05, waste: 0.20 }, // economic base 73%
    defaultHRatio: 0.80,
    yieldDMin: 6, yieldDMax: 40,
    econBasePct: 73,   // 南方杉木产区出材率范围70-78%,中等林分取73%
    note: 'DB51采用LY208-77参数。推荐。贵州DB52/T 702有变指数公式'
  },
  {
    id: 'cypress', name: '柏木', latin: 'Cupressus funebris',
    a: 0.0000687928, b: 1.593567, c: 1.176727, isDynamic: false,
    source: 'DB51/T 1467-2012 四川省标(2025废止)', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.20, fuel: 0.05, waste: 0.20 }, // economic base 71%
    defaultHRatio: 0.65,
    yieldDMin: 6, yieldDMax: 36,
    econBasePct: 71,   // 柏木干形中等,尖削度0.45,DB51标准
    note: '✅ 7个查表值验证一致。贵州DB52/T 773有变指数公式。推荐'
  },
  {
    id: 'cryptomeria', name: '柳杉(本地实际表)', latin: 'Cryptomeria fortunei',
    a: 0.000073839671, b: 1.979618, c: 0.836352, isDynamic: false,
    source: '本地实际使用材积表 回归(R²=0.992, n=80)', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.20, fuel: 0.05, waste: 0.20 }, // 柳杉经济材72%(估)
    defaultHRatio: 0.75,
    yieldDMin: 6, yieldDMax: 50,
    note: '⭐ 本地现用表！从用户提供的80个表值回归。D=20 H=15→0.268m³'
  },
  {
    id: 'cryptomeria-db51', name: '柳杉(DB51标参)', latin: 'Cryptomeria fortunei',
    a: 0.000056280669, b: 1.82910409, c: 1.05195643, isDynamic: false,
    source: 'DB51/T 1462-2012 四川省标(现行)', reliability: 'high',
    yieldRates: { spec: 0.52, nonSpec: 0.20, fuel: 0.05, waste: 0.23 }, // 柳杉经济材72%(估)
    defaultHRatio: 0.75,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 72,   // DB51/T 1462 柳杉
    note: 'DB51省标参考。D=20 H=15→0.233m³。与实际表偏差+15%'
  },
  {
    id: 'yunnan-pine', name: '云南松', latin: 'Pinus yunnanensis',
    a: 0.000058290117, b: 1.9796344, c: 0.90715154, isDynamic: false,
    source: 'LY208-77 旧标 / DB51/T 1465-2012（已废止）', reliability: 'medium',
    yieldRates: { spec: 0.5, nonSpec: 0.18, fuel: 0.07, waste: 0.25 }, // 云南松经济材70%(估)
    defaultHRatio: 0.68,
    yieldDMin: 6, yieldDMax: 40,
    note: '⚠ 旧标公式。2025新标DB53/T 1422.1已发布(天然/人工分开建模)，PDF已下载但需OCR提取系数'
  },
  {
    id: 'yunnan-pine-natural', name: '云南松(天然·2025)', latin: 'P. yunnanensis (natural)',
    a: 0.0000745425124, b: 1.846030, c: 0.921690, isDynamic: false,
    source: 'DB53/T 1422.1-2025 表A.1回归拟合(R²=0.994)', reliability: 'high',
    yieldRates: { spec: 0.48, nonSpec: 0.17, fuel: 0.07, waste: 0.28 }, // economic base 65%
    defaultHRatio: 0.60,
    yieldDMin: 6, yieldDMax: 40,
    econBasePct: 65,   // 天然林干形弯曲,树皮厚
    note: '✅ 从78个表值回归拟合。2038株样木(天然1050)。2025-09-07实施'
  },
  {
    id: 'yunnan-pine-planted', name: '云南松(人工·2025)', latin: 'P. yunnanensis (planted)',
    a: 0.00005696539, b: 1.991005, c: 0.841387, isDynamic: false,
    source: 'DB53/T 1422.1-2025 表A.2回归拟合(R²=0.992)', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.18, fuel: 0.05, waste: 0.22 }, // 人工云南松经济材72%(估)
    defaultHRatio: 0.72,
    yieldDMin: 6, yieldDMax: 40,
    note: '✅ 从56个表值回归拟合。2038株样木(人工988)。2025-09-07实施'
  },
  // ---- 西南通用 LY208-77 ----
  {
    id: 'armand-pine', name: '华山松', latin: 'Pinus armandii',
    a: 0.000059973839, b: 1.8334312, c: 1.0295315, isDynamic: false,
    source: 'LY208-77 西南地区', reliability: 'medium',
    yieldRates: { spec: 0.5, nonSpec: 0.18, fuel: 0.07, waste: 0.25 }, // economic base 68%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 68,   // 华山松树干通直度中等,西南经验
    note: '西南通用公式。贵州有DB52/T 768-2012'
  },
  {
    id: 'oak', name: '栎类', latin: 'Quercus spp.',
    a: 0.000059599785, b: 1.8564005, c: 0.93056206, isDynamic: false,
    source: 'LY208-77 栎类专用', reliability: 'medium',
    yieldRates: { spec: 0.4, nonSpec: 0.17, fuel: 0.08, waste: 0.35 }, // 栎类经济材61%(估)
    defaultHRatio: 0.65,
    yieldDMin: 6, yieldDMax: 60,
    note: 'LY208-77栎类专用系数。贵州DB52/T 826硬阔标准含栎类(已下载)'
  },
  {
    id: 'alder', name: '桤木', latin: 'Alnus cremastogyne',
    a: 0.000052750716, b: 1.9450324, c: 0.93862330, isDynamic: false,
    source: 'LY208-77 四川滇西北阔叶公式', reliability: 'medium',
    yieldRates: { spec: 0.42, nonSpec: 0.15, fuel: 0.08, waste: 0.35 }, // economic base 62%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 36,
    econBasePct: 62,   // 桤木速生阔叶,尖削度大
    note: '常见速生树种。贵州软阔DB52/T 822含桤木(已下载)'
  },
  {
    id: 'poplar', name: '杨树', latin: 'Populus spp.',
    a: 0.000052750716, b: 1.9450324, c: 0.93862330, isDynamic: false,
    source: 'LY208-77 四川滇西北阔叶公式', reliability: 'medium',
    yieldRates: { spec: 0.50, nonSpec: 0.20, fuel: 0.05, waste: 0.25 }, // 杨树经济材70%(估)
    econBasePct: 70,
    defaultHRatio: 0.80,
    yieldDMin: 6, yieldDMax: 50,
    note: '四川杨树通用公式'
  },
  {
    id: 'soft-broad', name: '软阔', latin: 'Soft broadleaf spp.',
    a: 0.000052750716, b: 1.9450324, c: 0.93862330, isDynamic: false,
    source: 'LY208-77 四川滇西北阔叶公式', reliability: 'medium',
    yieldRates: { spec: 0.42, nonSpec: 0.15, fuel: 0.08, waste: 0.35 }, // 桤木/软阔经济材63%(估)
    econBasePct: 57,
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    note: '含杨柳桤枫香香椿。贵州DB52/T 822软阔标准已下载'
  },
  {
    id: 'hard-broad', name: '硬阔', latin: 'Hard broadleaf spp.',
    a: 0.000052750716, b: 1.9450324, c: 0.93862330, isDynamic: false,
    source: 'LY208-77 四川滇西北阔叶公式(谨慎使用)', reliability: 'low',
    yieldRates: { spec: 0.45, nonSpec: 0.17, fuel: 0.08, waste: 0.3 }, // economic base 65%
    defaultHRatio: 0.68,
    yieldDMin: 6, yieldDMax: 60,
    econBasePct: 65,   // 硬阔类,干形中等偏上
    note: '⚠ 硬阔近似值。贵州DB52/T 826硬阔标准含壳斗科(已下载)'
  },
  // ---- 贵州 DB52 变指数模型（精度更高，供参考对比）----
  {
    id: 'fir-gz', name: '杉木(贵州)', latin: 'Cunninghamia lanceolata',
    a: 0.000080597, b: 0, c: 0, isDynamic: true,
    b1: 1.96709, b2: -0.0059006, c1: 0.7699, c2: 0.0072346,
    source: 'DB52/T 702-2011 贵州省标(现行)', reliability: 'high',
    yieldRates: { spec: 0.52, nonSpec: 0.20, fuel: 0.05, waste: 0.23 }, // 杉木经济材73%(估)
    defaultHRatio: 0.80,
    yieldDMin: 6, yieldDMax: 40,
    note: '变指数模型: V=a×D^(b1+b2(D+H))×H^(c1+c2(D+H))，精度高于固定指数'
  },
  {
    id: 'pine-gz', name: '马尾松(贵州)', latin: 'Pinus massoniana',
    a: 0.000062341803, b: 1.8551497, c: 0.95682492, isDynamic: false,
    source: 'DB52/T 703-2011 贵州省标(现行,已下载)', reliability: 'high',
    yieldRates: { spec: 0.6, nonSpec: 0.2, fuel: 0.05, waste: 0.15 }, // economic base 78%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 78,   // 贵州马尾松
    note: '贵州人工马尾松。已下载标准全文(12页)'
  },
  {
    id: 'cypress-gz', name: '柏木(贵州)', latin: 'Cupressus funebris',
    a: 0.000085626, b: 0, c: 0, isDynamic: true,
    b1: 1.9148, b2: -0.0045828, c1: 0.74041, c2: 0.00668,
    source: 'DB52/T 773-2012 贵州省标(现行)', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.20, fuel: 0.05, waste: 0.20 }, // economic base 71%
    defaultHRatio: 0.65,
    yieldDMin: 6, yieldDMax: 36,
    econBasePct: 71,   // 贵州柏木变指数,同柏木组
    note: '变指数模型，指数随D+H线性变化，干形适应性更强'
  },
  {
    id: 'soft-gz', name: '软阔(贵州)', latin: 'Soft broadleaf (Guizhou)',
    a: 0.000073624, b: 0, c: 0, isDynamic: true,
    b1: 1.89885, b2: 0, c1: 0.85616, c2: 0.00064635,
    source: 'DB52/T 822-2013 贵州省标(现行,已下载)', reliability: 'high',
    yieldRates: { spec: 0.42, nonSpec: 0.15, fuel: 0.08, waste: 0.35 }, // economic base 62%
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 62,   // 贵州软阔变指数,同软阔组
    note: '变指数模型。含枫香桦木香椿杨树朴树。已下载标准全文(12页)'
  },
  // ---- 安徽 DB34/T 3345-2019 ----
  {
    id: 'masson-pine-ah', name: '马尾松(安徽·2019)', latin: 'Pinus massoniana (Anhui)',
    a: 0.0000623418, b: 1.875389, c: 0.918393, isDynamic: false,
    source: 'DB34/T 3345-2019 安徽省马尾松二元立木材积表', reliability: 'high',
    yieldRates: { spec: 0.60, nonSpec: 0.20, fuel: 0.05, waste: 0.15 },
    defaultHRatio: 0.68,
    yieldDMin: 6, yieldDMax: 50,
    econBasePct: 78,
    note: '安徽2019年新编表。D=20 H=15→0.207m³。与四川DB51参数不同'
  },

  // ---- 福建 DB35/T 1823-2019 ----
  {
    id: 'chinese-fir-fj', name: '杉木(福建·2019)', latin: 'Cunninghamia lanceolata (Fujian)',
    a: 0.0000706094, b: 1.801671, c: 0.997998, isDynamic: false,
    source: 'DB35/T 1823-2019 福建省主要树种二元立木材积表', reliability: 'high',
    yieldRates: { spec: 0.55, nonSpec: 0.20, fuel: 0.05, waste: 0.20 },
    econBasePct: 75,
    defaultHRatio: 0.80,
    yieldDMin: 6, yieldDMax: 40,
    note: '福建2019年新编表。D=20 H=15→0.2326m³。精度高于LY208-77旧标'
  },
  {
    id: 'masson-pine-fj', name: '马尾松(福建·2019)', latin: 'Pinus massoniana (Fujian)',
    a: 0.000070728, b: 1.874518, c: 0.908949, isDynamic: false,
    source: 'DB35/T 1823-2019 福建省主要树种二元立木材积表', reliability: 'high',
    yieldRates: { spec: 0.60, nonSpec: 0.20, fuel: 0.05, waste: 0.15 },
    econBasePct: 80,
    defaultHRatio: 0.68,
    yieldDMin: 6, yieldDMax: 50,
    note: '福建2019年新编表。D=20 H=15→0.2277m³。与四川DB51/本地表参数不同'
  },
  {
    id: 'broadleaf-fj', name: '阔叶树(福建·2019)', latin: 'Broadleaf spp. (Fujian)',
    a: 0.0000685634, b: 1.933221, c: 0.867885, isDynamic: false,
    source: 'DB35/T 1823-2019 福建省主要树种二元立木材积表', reliability: 'high',
    yieldRates: { spec: 0.45, nonSpec: 0.17, fuel: 0.08, waste: 0.30 },
    econBasePct: 62,
    defaultHRatio: 0.70,
    yieldDMin: 6, yieldDMax: 50,
    note: '福建阔叶树通用公式，涵盖桉树相思等速生树种。D=20 H=15→0.2355m³'
  },
  {
    id: 'other-conifer-fj', name: '其他针叶(福建·2019)', latin: 'Other conifer spp. (Fujian)',
    a: 0.000069978, b: 1.8660492, c: 0.905254, isDynamic: false,
    source: 'DB35/T 1823-2019 福建省主要树种二元立木材积表', reliability: 'high',
    yieldRates: { spec: 0.50, nonSpec: 0.18, fuel: 0.07, waste: 0.25 },
    econBasePct: 68,
    defaultHRatio: 0.72,
    yieldDMin: 6, yieldDMax: 40,
    note: '福建其他针叶通用公式，涵盖火炬松湿地松等。D=20 H=15→0.2175m³'
  }
];

// ========== 常量 ==========
ForestCalc.YIELD_DISCLAIMER = '出材率参考《四川林业计量数表编制技术研究》(2013省科技进步三等奖)等标准成果。精确出材率需查对应标准的单木出材率表（按胸径树高分段内插）。应用内支持自定义综合出材率。';
ForestCalc.STORAGE_KEY = 'fc_custom_species';
ForestCalc.HIST_KEY = 'fc_history';

// ========== 工具函数 ==========
ForestCalc.getActiveSpecies = function() {
  var cs = ForestCalc.getCustomSpecies();
  if (cs) return cs;
  var sel = document.getElementById('speciesSelect');
  var idx = parseInt(sel.value);
  return (idx >= 0 && idx < ForestCalc.SPECIES.length) ? ForestCalc.SPECIES[idx] : ForestCalc.SPECIES[0];
};

ForestCalc.getCustomSpecies = function() {
  var ca = parseFloat(document.getElementById('cA').value);
  var cb = parseFloat(document.getElementById('cB').value);
  var cc = parseFloat(document.getElementById('cC').value);
  var name = document.getElementById('cName').value.trim();
  if (!isNaN(ca) && !isNaN(cb) && !isNaN(cc) && ca > 0) {
    return { a: ca, b: cb, c: cc, isDynamic: false, name: name || '自定义', yieldRates: { spec: 0.42, nonSpec: 0.16, fuel: 0.13, waste: 0.29 } };
  }
  return null;
};
