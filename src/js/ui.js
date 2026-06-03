// ========== UI 渲染与交互 ==========
// 依赖 species-db.js, calculator.js, storage.js

var ForestCalc = window.ForestCalc || {};

// 批量计算数据（全局状态）
ForestCalc.batchRows = [];

// ========== 初始化 ==========
ForestCalc.initApp = function() {
  var sel = document.getElementById('speciesSelect');
  ForestCalc.SPECIES.forEach(function(s, i) {
    var o = document.createElement('option');
    o.value = i; o.textContent = s.name + '（' + s.latin + '）';
    sel.appendChild(o);
  });
  ForestCalc.onSpeciesChange();
  ForestCalc.renderDataPanel();
  ForestCalc.renderSavedList();
  ForestCalc.renderHistory();
  // 恢复暗色主题
  if (localStorage.getItem('fc_theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
};

// ========== 树种切换 ==========
ForestCalc.onSpeciesChange = function() {
  var s = ForestCalc.SPECIES[document.getElementById('speciesSelect').value];
  var cls = s.reliability === 'high' ? 'badge-high' : s.reliability === 'medium' ? 'badge-medium' : 'badge-low';
  var txt = s.reliability === 'high' ? '省标验证' : s.reliability === 'medium' ? '部标/文献' : '待验证';
  var formulaStr;
  if (s.isDynamic && s.b1 !== undefined) {
    formulaStr = 'V = ' + s.a + ' × D<sup>(' + s.b1 + (s.b2>=0?'+':'') + s.b2 + '×(D+H))</sup> × H<sup>(' + s.c1 + (s.c2>=0?'+':'') + s.c2 + '×(D+H))</sup>';
  } else {
    formulaStr = 'V = ' + s.a + ' × D<sup>' + s.b + '</sup> × H<sup>' + s.c + '</sup>';
  }
  var bar = document.getElementById('speciesBar');
  bar.innerHTML =
    '<span class="badge ' + cls + '">' + txt + '</span>' +
    formulaStr +
    '&nbsp;|&nbsp; ' + s.source +
    '&nbsp;|&nbsp; 出材率: 规格' + (s.yieldRates.spec*100).toFixed(0) + '% 非规格' + (s.yieldRates.nonSpec*100).toFixed(0) + '% 薪材' + (s.yieldRates.fuel*100).toFixed(0) + '% 废材' + (s.yieldRates.waste*100).toFixed(0) + '%' +
    '<br><small>' + s.note + '</small>';
};

// ========== 单株计算 ==========
ForestCalc.calcSingle = function() {
  var s = ForestCalc.getActiveSpecies();
  var dbh = parseFloat(document.getElementById('dbhInput').value);
  var height = parseFloat(document.getElementById('heightInput').value);
  var count = parseInt(document.getElementById('countInput').value) || 1;
  var area = parseFloat(document.getElementById('areaInput').value) || 0;

  if (!dbh || dbh <= 0 || !height || height <= 0) {
    document.getElementById('singleResult').innerHTML = '<div class="callout callout-warn">请输入有效的胸径和树高。</div>';
    document.getElementById('singleResult').classList.add('show');
    return;
  }
  if (s.a === 0) {
    document.getElementById('singleResult').innerHTML = '<div class="callout callout-danger">该树种暂无可靠的二元材积公式系数，无法计算。</div>';
    document.getElementById('singleResult').classList.add('show');
    return;
  }
  if (dbh > 300) { alert('胸径超出合理范围（>300cm），请核实。'); return; }
  if (height > 100) { alert('树高超出合理范围（>100m），请核实。'); return; }
  if (count < 1) { alert('棵数至少为1。'); return; }

  var vol1 = ForestCalc.calcVolume(s, dbh, height);
  var vol = vol1 * count;
  var yr = ForestCalc.getYieldRates(s);
  var y1 = { spec: vol1*yr.spec, nonSpec: vol1*yr.nonSpec, fuel: vol1*yr.fuel, waste: vol1*yr.waste };
  var y = {
    spec: y1.spec * count,
    nonSpec: y1.nonSpec * count,
    fuel: y1.fuel * count,
    waste: y1.waste * count
  };
  var totalEcon = y.spec + y.nonSpec;
  var rate = (totalEcon / vol * 100);

  // Record history
  var spName = s.name || '自定义';
  ForestCalc.addHistory(spName, dbh, height, count, vol, totalEcon);

  var areaHtml = '';
  if (area > 0) {
    areaHtml =
    '<div class="area-hero">' +
      '<div class="area-title">亩均统计（' + area.toFixed(1) + ' 亩）</div>' +
      '<div class="area-grid">' +
        '<div class="area-stat"><span class="big">' + (vol/area).toFixed(4) + '</span> m³/亩 蓄积</div>' +
        '<div class="area-stat"><span class="big">' + (totalEcon/area).toFixed(4) + '</span> m³/亩 经济材</div>' +
        '<div class="area-stat"><span class="big">' + (y.spec/area).toFixed(4) + '</span> m³/亩 规格材</div>' +
      '</div>' +
    '</div>';
  }

  // 公顷蓄积量计算
  var densityVal = parseInt(document.getElementById('density').value) || 0;
  var hectareHtml = '';
  if (densityVal > 0) {
    var haInput = { spec: y1.spec, nonSpec: y1.nonSpec, fuel: y1.fuel, waste: y1.waste };
    var ha = ForestCalc.calcPerHectare(vol1, haInput, densityVal);
    hectareHtml =
    '<div style="margin-top:12px;padding:10px;background:rgba(196,165,110,0.06);border-radius:8px;border:1px solid rgba(196,165,110,0.15);">' +
      '<h4 style="margin:0 0 6px 0;">📐 公顷蓄积量 (' + densityVal + ' 株/公顷)</h4>' +
      '<table style="width:100%;font-size:13px;">' +
      '<tr><td>总蓄积</td><td style="text-align:right;font-weight:bold;">' + ha.totalVolume.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>规格材</td><td style="text-align:right;">' + ha.totalSpec.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>非规格材</td><td style="text-align:right;">' + ha.totalNonSpec.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>薪材</td><td style="text-align:right;">' + ha.totalFuel.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>废材</td><td style="text-align:right;">' + ha.totalWaste.toFixed(3) + ' m³</td></tr>' +
      '</table></div>';
  }

  // 亩蓄积量计算
  var densityMuVal = parseInt(document.getElementById('densityMu').value) || 0;
  var muHtml = '';
  if (densityMuVal > 0) {
    var muInput = { spec: y1.spec, nonSpec: y1.nonSpec, fuel: y1.fuel, waste: y1.waste };
    var mu = ForestCalc.calcPerMu(vol1, muInput, densityMuVal);
    muHtml =
    '<div style="margin-top:8px;padding:10px;background:rgba(196,165,110,0.06);border-radius:8px;border:1px solid rgba(196,165,110,0.15);">' +
      '<h4 style="margin:0 0 6px 0;">📐 亩蓄积量 (' + densityMuVal + ' 株/亩)</h4>' +
      '<table style="width:100%;font-size:13px;">' +
      '<tr><td>总蓄积</td><td style="text-align:right;font-weight:bold;">' + mu.totalVolume.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>规格材</td><td style="text-align:right;">' + mu.totalSpec.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>非规格材</td><td style="text-align:right;">' + mu.totalNonSpec.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>薪材</td><td style="text-align:right;">' + mu.totalFuel.toFixed(3) + ' m³</td></tr>' +
      '<tr><td>废材</td><td style="text-align:right;">' + mu.totalWaste.toFixed(3) + ' m³</td></tr>' +
      '</table></div>';
  }

  var div = document.getElementById('singleResult');
  div.classList.add('show');
  div.innerHTML =
    '<div class="volume-hero">' +
      '<div class="volume-number">' + vol.toFixed(4) + '</div>' +
      '<div class="volume-unit">立方米 (m³) — ' + count + ' 株 × 单株 ' + vol1.toFixed(4) + ' m³ = 总蓄积量</div>' +
    '</div>' +
    areaHtml +
    hectareHtml +
    muHtml +
    '<div class="yield-grid">' +
      '<div class="yield-item economic">' +
        '<div class="yield-val">' + totalEcon.toFixed(4) + ' m³</div>' +
        '<div class="yield-label">经济材合计（规格+非规格）</div>' +
        '<div style="font-size:12px;color:var(--pine);margin-top:2px;">出材率 ' + rate.toFixed(1) + '%</div>' +
      (s.econBasePct !== undefined ? '<small style="color:var(--wood);font-size:10px;">📌 经济材率基准: ' + s.econBasePct + '% @D20H15 · 斜率: DB51/T 1466 (R²=0.977)</small>' : '') +
      '</div>' +
      '<div class="yield-item">' +
        '<div class="yield-val">' + y.spec.toFixed(4) + ' m³</div>' +
        '<div class="yield-label">规格材（小头直径≥6cm）</div>' +
      '</div>' +
      '<div class="yield-item">' +
        '<div class="yield-val">' + y.nonSpec.toFixed(4) + ' m³</div>' +
        '<div class="yield-label">非规格材</div>' +
      '</div>' +
      '<div class="yield-item">' +
        '<div class="yield-val">' + y.fuel.toFixed(4) + ' m³</div>' +
        '<div class="yield-label">薪材</div>' +
      '</div>' +
      '<div class="yield-item">' +
        '<div class="yield-val">' + y.waste.toFixed(4) + ' m³</div>' +
        '<div class="yield-label">废材（不可利用）</div>' +
      '</div>' +
    '</div>' +
    '<div class="callout callout-info" style="margin-top:14px;">' + ForestCalc.YIELD_DISCLAIMER + '</div>';
};

// ========== 批量计算 ==========
ForestCalc.addToBatch = function() {
  var idx = parseInt(document.getElementById('speciesSelect').value);
  var dbh = parseFloat(document.getElementById('dbhInput').value);
  var height = parseFloat(document.getElementById('heightInput').value);
  var count = parseInt(document.getElementById('countInput').value) || 1;
  if (!dbh || dbh <= 0 || !height || height <= 0) {
    alert('请先输入有效的胸径和树高。');
    return;
  }
  for (var i = 0; i < count; i++) {
    ForestCalc.batchRows.push({ speciesIdx: idx, dbh: dbh, height: height });
  }
  ForestCalc.renderBatch();
  document.getElementById('batchCard').scrollIntoView({ behavior: 'smooth' });
};

ForestCalc.addRow = function() {
  ForestCalc.batchRows.push({ speciesIdx: 0, dbh: '', height: '' });
  ForestCalc.renderBatch();
};

ForestCalc.clearBatch = function() {
  if (confirm('确定清空全部批量数据？')) { ForestCalc.batchRows = []; ForestCalc.renderBatch(); }
};

ForestCalc.renderBatch = function() {
  var tbody = document.getElementById('batchBody');
  if (ForestCalc.batchRows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="padding:32px;color:#8b7355;">暂无数据 — 请添加树木</td></tr>';
    document.getElementById('batchSummary').style.display = 'none';
    return;
  }
  var h = '';
  ForestCalc.batchRows.forEach(function(r, i) {
    var s = ForestCalc.SPECIES[r.speciesIdx];
    var vv = r._vol, sp = r._spec, ns = r._nonSpec, fl = r._fuel, wa = r._waste;
    var speciesOptions = '';
    ForestCalc.SPECIES.forEach(function(sp, si) {
      speciesOptions += '<option value="' + si + '"' + (si===r.speciesIdx?' selected':'') + '>' + sp.name + '</option>';
    });
    h += '<tr>' +
      '<td>' + (i+1) + '</td>' +
      '<td><select onchange="ForestCalc.batchRows[' + i + '].speciesIdx=parseInt(this.value);ForestCalc.batchRows[' + i + ']._vol=null;ForestCalc.renderBatch();">' + speciesOptions + '</select></td>' +
      '<td><input type="number" value="' + r.dbh + '" step="0.1" onchange="ForestCalc.batchRows[' + i + '].dbh=parseFloat(this.value)||\'\';ForestCalc.batchRows[' + i + ']._vol=null;ForestCalc.renderBatch();"></td>' +
      '<td><input type="number" value="' + r.height + '" step="0.1" onchange="ForestCalc.batchRows[' + i + '].height=parseFloat(this.value)||\'\';ForestCalc.batchRows[' + i + ']._vol=null;ForestCalc.renderBatch();"></td>' +
      '<td>' + (vv!=null?vv.toFixed(4):'—') + '</td><td>' + (sp!=null?sp.toFixed(4):'—') + '</td><td>' + (ns!=null?ns.toFixed(4):'—') + '</td><td>' + (fl!=null?fl.toFixed(4):'—') + '</td><td>' + (wa!=null?wa.toFixed(4):'—') + '</td>' +
      '<td><button class="btn btn-danger btn-sm" onclick="ForestCalc.batchRows.splice(' + i + ',1);ForestCalc.renderBatch();">✕</button></td>' +
    '</tr>';
  });
  tbody.innerHTML = h;
  document.getElementById('batchSummary').style.display = 'none';
};

ForestCalc.calcBatch = function() {
  var tV=0, tS=0, tN=0, tF=0, tW=0, cnt=0;
  ForestCalc.batchRows.forEach(function(r) {
    if (!r.dbh || r.dbh<=0 || !r.height || r.height<=0) return;
    var s = ForestCalc.SPECIES[r.speciesIdx];
    if (s.a === 0) return; // skip species with no formula
    var v = ForestCalc.calcVolume(s, r.dbh, r.height);
    var y = ForestCalc.calcYield(s, v);
    r._vol=v; r._spec=y.spec; r._nonSpec=y.nonSpec; r._fuel=y.fuel; r._waste=y.waste;
    tV+=v; tS+=y.spec; tN+=y.nonSpec; tF+=y.fuel; tW+=y.waste;
    cnt++;
  });
  ForestCalc.renderBatch();
  if (cnt===0) { alert('请至少输入一株有效树木。'); return; }

  var sb = document.getElementById('batchSummary');
  sb.style.display = '';
  var totalEconBatch = tS + tN;
  var areaB = parseFloat(document.getElementById('batchAreaInput').value) || 0;
  var areaRows = '';
  if (areaB > 0) {
    areaRows =
    '<tr class="summary-row" style="background:linear-gradient(180deg,#fdf3e4,#f8e8d0)!important;">' +
      '<td colspan="4">亩均统计（' + areaB.toFixed(1) + ' 亩）</td>' +
      '<td>' + (tV/areaB).toFixed(4) + ' m³/亩</td>' +
      '<td colspan="2">' + (totalEconBatch/areaB).toFixed(4) + ' m³/亩 经济材</td>' +
      '<td colspan="3">' + (tS/areaB).toFixed(4) + ' m³/亩 规格材</td>' +
    '</tr>';
  }
  // 公顷模式合计行
  var densityBatch = parseInt(document.getElementById('density').value) || 0;
  var hectareRow = '';
  if (densityBatch > 0 && cnt > 0) {
    var haVol = tV, haSpec = tS, haNonSpec = tN, haFuel = tF, haWaste = tW;
    hectareRow =
    '<tr class="summary-row" style="background:rgba(196,165,110,0.12);font-weight:bold;">' +
      '<td colspan="4">公顷合计（' + densityBatch + ' 株/公顷）</td>' +
      '<td>' + haVol.toFixed(3) + ' m³</td><td>' + haSpec.toFixed(3) + ' m³</td><td>' + haNonSpec.toFixed(3) + ' m³</td><td>' + haFuel.toFixed(3) + ' m³</td><td>' + haWaste.toFixed(3) + ' m³</td><td></td>' +
    '</tr>';
  }
  sb.innerHTML =
    '<tr class="summary-row">' +
      '<td colspan="4">采伐合计（' + cnt + ' 株）</td>' +
      '<td>' + tV.toFixed(4) + ' m³</td><td>' + tS.toFixed(4) + ' m³</td><td>' + tN.toFixed(4) + ' m³</td><td>' + tF.toFixed(4) + ' m³</td><td>' + tW.toFixed(4) + ' m³</td><td></td>' +
    '</tr>' +
    '<tr class="summary-row">' +
      '<td colspan="4">经济材总计</td>' +
      '<td colspan="2" style="color:var(--pine);font-size:16px;">' + totalEconBatch.toFixed(4) + ' m³</td>' +
      '<td colspan="2">综合出材率</td>' +
      '<td colspan="2">' + (tV>0?(totalEconBatch/tV*100).toFixed(1):0) + '%</td>' +
    '</tr>' +
    areaRows +
    hectareRow;

  // 统计摘要
  var validRows = ForestCalc.batchRows.filter(function(r) { return r._vol != null; });
  if (validRows.length > 1) {
    var vols = [], specs = [], nonSpecs = [], fuels = [], wastes = [];
    validRows.forEach(function(r) {
      vols.push(r._vol); specs.push(r._spec); nonSpecs.push(r._nonSpec); fuels.push(r._fuel); wastes.push(r._waste);
    });
    var avg = function(arr) { return arr.reduce(function(a,b) { return a+b; }, 0) / arr.length; };
    var min = function(arr) { return Math.min.apply(null, arr); };
    var max = function(arr) { return Math.max.apply(null, arr); };

    sb.innerHTML +=
    '<tr><td colspan="10">' +
    '<div style="margin-top:10px;padding:8px;background:rgba(196,165,110,0.06);border-radius:6px;">' +
    '<h5 style="margin:0 0 6px 0;">📊 统计摘要 (' + validRows.length + ' 条有效数据)</h5>' +
    '<table style="width:100%;font-size:12px;">' +
    '<tr style="border-bottom:1px solid rgba(196,165,110,0.15);"><th></th><th>单株材积</th><th>规格材</th><th>非规格材</th><th>薪材</th><th>废材</th></tr>' +
    '<tr><td>平均</td><td>' + avg(vols).toFixed(4) + '</td><td>' + avg(specs).toFixed(4) + '</td><td>' + avg(nonSpecs).toFixed(4) + '</td><td>' + avg(fuels).toFixed(4) + '</td><td>' + avg(wastes).toFixed(4) + '</td></tr>' +
    '<tr><td>最小</td><td>' + min(vols).toFixed(4) + '</td><td>' + min(specs).toFixed(4) + '</td><td>' + min(nonSpecs).toFixed(4) + '</td><td>' + min(fuels).toFixed(4) + '</td><td>' + min(wastes).toFixed(4) + '</td></tr>' +
    '<tr><td>最大</td><td>' + max(vols).toFixed(4) + '</td><td>' + max(specs).toFixed(4) + '</td><td>' + max(nonSpecs).toFixed(4) + '</td><td>' + max(fuels).toFixed(4) + '</td><td>' + max(wastes).toFixed(4) + '</td></tr>' +
    '</table></div>' +
    '</td></tr>';
  }

  sb.scrollIntoView({ behavior: 'smooth' });
};

// ========== 数据面板渲染 ==========
ForestCalc.renderDataPanel = function() {
  var div = document.getElementById('dataPanel');
  var h = '<div class="table-wrap src-table"><table><thead><tr><th>树种</th><th>a</th><th>b</th><th>c</th><th>公式来源</th><th>验证</th><th>出材率参考</th></tr></thead><tbody>';
  ForestCalc.SPECIES.forEach(function(s) {
    var dot = s.reliability==='high'?'conf-high':s.reliability==='medium'?'conf-medium':'conf-low';
    var lbl = s.reliability==='high'?'省标':(s.reliability==='medium'?'部标':(s.reliability==='low'?'近似':''));
    h += '<tr>' +
      '<td><strong>' + s.name + '</strong><br><small style="color:#8b7355;">' + s.latin + '</small></td>' +
      '<td>' + (s.a||'—') + '</td><td>' + (s.b||'—') + '</td><td>' + (s.c||'—') + '</td>' +
      '<td style="font-size:11px;">' + s.source + '</td>' +
      '<td><span class="confidence-dot ' + dot + '"></span>' + (lbl||'—') + '</td>' +
      '<td style="font-size:11px;">' + (s.a===0?'—':'规格'+(s.yieldRates.spec*100).toFixed(0)+'% 非规格'+(s.yieldRates.nonSpec*100).toFixed(0)+'%<br>薪材'+(s.yieldRates.fuel*100).toFixed(0)+'% 废材'+(s.yieldRates.waste*100).toFixed(0)+'%') + '</td>' +
    '</tr>';
  });
  h += '</tbody></table></div>';

  h +=
    '<div class="callout callout-warn">' +
      '<strong>验证说明：</strong><br>' +
      '马尾松公式已验证：D=20cm H=15.5m → V=0.256m³，与 DB51/T 1466-2012 标准查表值一致。<br>' +
      '柏木公式参数来自 DB51/T 1467-2012 标称值。D=20 H=15.5 → 0.205m³，与标准查表值一致。<br>' +
      '其余树种来自 LY208-77 部标或四川滇西北阔叶公式，精度可接受但非四川本地编表。' +
    '</div>' +
    '<div class="callout callout-info">' +
      '<strong>已获取的标准文件：</strong><br>' +
      'DB51/T 1466-2012 马尾松 &nbsp;|&nbsp; DB51/T 2918-2022 森林经营规程 &nbsp;|&nbsp; ' +
      'DB52/T 703-2011 马尾松(黔) &nbsp;|&nbsp; DB52/T 822-2013 软阔(黔) &nbsp;|&nbsp; ' +
      'DB52/T 826-2013 硬阔(黔)<br>' +
      'DB35/T 1823-2019 福建主要树种 &nbsp;|&nbsp; ' +
      'DB53/T 1422.1-2025 云南松(滇) &nbsp;|&nbsp; ' +
      'DB34/T 3345-2019 马尾松(皖)<br>' +
      'GB/T 4814-2013 原木材积表 &nbsp;|&nbsp; LY/T 2102-2013 编制技术规程' +
    '</div>' +
    '<div class="callout callout-info">' +
      '<strong>跨省公式对照（福建 DB35/T 1823-2019）：</strong><br>' +
      '杉木: V=0.0000706094×D^1.801671×H^0.997998 &nbsp;|&nbsp; ' +
      '马尾松: V=0.000070728×D^1.874518×H^0.908949<br>' +
      '阔叶树: V=0.0000685634×D^1.933221×H^0.867885 &nbsp;|&nbsp; ' +
      '其他针叶: V=0.000069978×D^1.8660492×H^0.905254' +
    '</div>';
  div.innerHTML = h;
};

// ========== 自定义公式保存/加载/删除 ==========
ForestCalc.saveCustom = function() {
  var name = document.getElementById('cName').value.trim();
  var a = parseFloat(document.getElementById('cA').value);
  var b = parseFloat(document.getElementById('cB').value);
  var c = parseFloat(document.getElementById('cC').value);
  if (!name || isNaN(a) || isNaN(b) || isNaN(c)) { alert('请填写树种名称和 a,b,c 三个系数。'); return; }
  var saved = ForestCalc.loadSavedCustoms();
  saved.push({ name: name, a: a, b: b, c: c, time: new Date().toLocaleString() });
  if (saved.length > 20) saved.shift();
  ForestCalc.saveCustomToStorage(saved);
  ForestCalc.renderSavedList();
  alert('已保存: ' + name);
};

ForestCalc.applySaved = function(idx) {
  var saved = ForestCalc.loadSavedCustoms();
  var s = saved[idx];
  if (!s) return;
  document.getElementById('cName').value = s.name;
  document.getElementById('cA').value = s.a;
  document.getElementById('cB').value = s.b;
  document.getElementById('cC').value = s.c;
  document.getElementById('customFields').style.display = 'block';
  document.querySelectorAll('.yield-toggle')[1].innerHTML = '自定义树种/公式 ▾ 点击收起';
};

ForestCalc.deleteSaved = function(idx) {
  var saved = ForestCalc.loadSavedCustoms();
  saved.splice(idx, 1);
  ForestCalc.saveCustomToStorage(saved);
  ForestCalc.renderSavedList();
};

ForestCalc.renderSavedList = function() {
  var saved = ForestCalc.loadSavedCustoms();
  var container = document.getElementById('savedCustoms');
  var list = document.getElementById('savedList');
  if (saved.length === 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  list.innerHTML = saved.map(function(s, i) {
    return '<span style="cursor:pointer;color:var(--pine);margin-right:12px;" onclick="ForestCalc.applySaved(' + i + ')" title="点击应用">' +
      s.name + '</span>' +
      '<span style="cursor:pointer;color:var(--danger);font-size:10px;" onclick="ForestCalc.deleteSaved(' + i + ')">✕</span>';
  }).join(' | ');
};

// ========== 计算历史渲染 ==========
ForestCalc.renderHistory = function() {
  var hist = ForestCalc.loadHistory();
  document.getElementById('histCount').textContent = hist.length;
  var panel = document.getElementById('histPanel');
  if (hist.length === 0) { panel.innerHTML = '<span style="color:#8b7355;">暂无记录</span>'; return; }
  panel.innerHTML = '<table style="font-size:11px;width:100%;"><thead><tr><th>时间</th><th>树种</th><th>D(cm)</th><th>H(m)</th><th>株</th><th>蓄积(m³)</th><th>经济材(m³)</th></tr></thead><tbody>' +
    hist.map(function(h) { return '<tr><td>'+h.time+'</td><td>'+h.species+'</td><td>'+h.dbh+'</td><td>'+h.height+'</td><td>'+h.count+'</td><td>'+h.vol+'</td><td>'+h.econ+'</td></tr>'; }).join('') +
    '</tbody></table>';
};

// ========== 折叠/展开控制 ==========
ForestCalc.toggleHistory = function() {
  var panel = document.getElementById('histPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
};

ForestCalc.toggleCustom = function() {
  var el = document.getElementById('customFields');
  var show = el.style.display === 'none';
  el.style.display = show ? 'block' : 'none';
  document.querySelectorAll('.yield-toggle')[1].innerHTML = show ? '自定义树种/公式 ▾ 点击收起' : '自定义树种/公式 ▸ 点击展开';
};

ForestCalc.toggleYield = function() {
  var el = document.getElementById('yieldFields');
  var show = el.style.display === 'none';
  el.style.display = show ? 'block' : 'none';
  document.querySelector('.yield-toggle').innerHTML = show ? '综合出材率 ▾ 点击收起' : '综合出材率 ▸ 点击自定义';
};

ForestCalc.toggleData = function(el) {
  el.classList.toggle('open');
  el.nextElementSibling.classList.toggle('open');
};

// ========== 清空历史 ==========
ForestCalc.clearHistoryUI = function() {
  if (confirm('确定清空所有计算历史？')) { ForestCalc.clearHistory(); ForestCalc.renderHistory(); }
};

// ========== 暗色主题切换 ==========
ForestCalc.toggleTheme = function() {
  document.body.classList.toggle('dark');
  var isDark = document.body.classList.contains('dark');
  document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('fc_theme', isDark ? 'dark' : 'light');
};

// ========== 批量结果 CSV 导出 ==========
ForestCalc.exportBatchCSV = function() {
  var rows = ForestCalc.batchRows;
  var validRows = rows.filter(function(r) { return r._vol != null; });
  if (validRows.length === 0) { alert('请先计算批量数据'); return; }
  
  var csv = '\uFEFF序号,树种,胸径(cm),树高(m),蓄积量(m³),规格材(m³),非规格材(m³),薪材(m³),废材(m³)\n';
  validRows.forEach(function(r, i) {
    var s = ForestCalc.SPECIES ? ForestCalc.SPECIES[r.speciesIdx] : null;
    var name = s ? s.name : '未知';
    csv += (i+1) + ',' + name + ',' + r.dbh + ',' + r.height + ',' + r._vol.toFixed(4) + ',' + r._spec.toFixed(4) + ',' + r._nonSpec.toFixed(4) + ',' + r._fuel.toFixed(4) + ',' + r._waste.toFixed(4) + '\n';
  });
  
  var blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '采伐计算汇总_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ========== 跨省标准对比 ==========
ForestCalc.showCompare = function() {
  var d = parseFloat(document.getElementById('dbhInput').value) || 20;
  var h = parseFloat(document.getElementById('heightInput').value) || 15;

  var groups = [
    { title: '马尾松 (4省)', ids: ['masson-pine','masson-pine-db51','pine-gz','masson-pine-fj'] },
    { title: '杉木 (3省)', ids: ['chinese-fir','fir-gz','chinese-fir-fj'] },
    { title: '柏木 (2省)', ids: ['cypress','cypress-gz'] },
    { title: '阔叶树 (3省)', ids: ['soft-broad','soft-gz','broadleaf-fj'] }
  ];

  var html = '<div style="margin-top:16px;"><h4>📊 跨省标准对比 (D=' + d + 'cm H=' + h + 'm)</h4>';
  groups.forEach(function(g) {
    html += '<table style="width:100%;margin-bottom:10px;border-collapse:collapse;font-size:13px;">';
    html += '<tr style="background:rgba(196,165,110,0.08);"><th colspan="5" style="text-align:left;padding:6px 8px;">' + g.title + '</th></tr>';
    html += '<tr style="border-bottom:2px solid rgba(196,165,110,0.3);color:var(--wood);">';
    html += '<th style="text-align:left;">标准</th><th>材积(m³)</th><th>经济材率</th><th>规格材(m³)</th><th style="text-align:left;">来源</th></tr>';

    g.ids.forEach(function(sid) {
      var s = ForestCalc.SPECIES.find(function(x) { return x.id === sid; });
      if (!s) return;
      var vol = ForestCalc.calcVolume(s, d, h);
      if (vol === null) return;
      var y = ForestCalc.calcYield(s, vol, d, h);

      html += '<tr style="border-bottom:1px solid rgba(196,165,110,0.1);">';
      html += '<td>' + s.name + '</td>';
      html += '<td>' + vol.toFixed(4) + '</td>';
      html += '<td>' + (y.econRate * 100).toFixed(1) + '%</td>';
      html += '<td>' + y.spec.toFixed(4) + '</td>';
      var src = (s.source || '').replace('DB51/T ', 'DB51/').replace('DB52/T ', 'DB52/').replace('DB35/T ', 'DB35/');
      html += '<td style="font-size:11px;color:var(--wood-dark);">' + src.substring(0, 28) + '</td>';
      html += '</tr>';
    });

    html += '</table>';
  });
  html += '<small style="color:var(--wood);">注: 材积差异来自各省标准系数不同，经济材率来自树种级 econBasePct</small></div>';

  var container = document.getElementById('batchSummary');
  container.innerHTML = html;
  container.style.display = '';
  document.getElementById('batchCard').scrollIntoView({ behavior: 'smooth' });
};

// ========== 收方表生成 ==========
ForestCalc.showYieldTable = function() {
  var panel = document.getElementById('yieldTableOptions');
  if (panel && (panel.style.display === 'none' || panel.style.display === '')) {
    panel.style.display = 'block';
  }

  var speciesId = ForestCalc.SPECIES[document.getElementById('speciesSelect').value]?.id;
  if (!speciesId) { alert('请先选择树种'); return; }

  var dMin = parseInt(document.getElementById('dMinYield')?.value) || 6;
  var dMax = parseInt(document.getElementById('dMaxYield')?.value) || 40;
  var step = parseInt(document.getElementById('stepYield')?.value) || 2;

  var result = ForestCalc.generateYieldTable(speciesId, dMin, dMax, step, 0.75);
  if (!result) { alert('生成失败，请检查树种数据'); return; }

  var rows = result.rows;
  var html = '<div style="margin-top:16px;">';
  html += '<h4>📋 ' + result.species.name + ' 收方表 (D ' + dMin + '~' + dMax + 'cm, 步长 ' + step + 'cm, H≈D×0.75)</h4>';
  html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:13px;">';
  html += '<thead><tr style="background:rgba(196,165,110,0.12);">';
  html += '<th>D(cm)</th><th>H(m)</th><th>材积(m³)</th><th>规格材</th><th>非规格材</th><th>薪材</th><th>废材</th><th>经济材率</th>';
  html += '</tr></thead><tbody>';

  rows.forEach(function(r) {
    html += '<tr style="border-bottom:1px solid rgba(196,165,110,0.1);">';
    html += '<td>' + r.dbh + '</td>';
    html += '<td>' + r.height + '</td>';
    html += '<td style="font-weight:bold;">' + r.volume.toFixed(4) + '</td>';
    html += '<td>' + r.specVol.toFixed(4) + '</td>';
    html += '<td>' + r.nonSpecVol.toFixed(4) + '</td>';
    html += '<td>' + r.fuelVol.toFixed(4) + '</td>';
    html += '<td>' + r.wasteVol.toFixed(4) + '</td>';
    html += '<td>' + (r.econRate * 100).toFixed(1) + '%</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  // 亩/公顷合计
  var density = parseInt(document.getElementById('density').value) || 0;
  var densityMu = parseInt(document.getElementById('densityMu').value) || 0;
  if (density > 0 || densityMu > 0) {
    html += '<div style="margin-top:8px;">';
    if (density > 0) {
      html += '<p style="font-size:12px;color:var(--wood);">📐 公顷合计: 总蓄积 ' + (rows.reduce(function(s,r){return s+r.volume;},0) * density).toFixed(2) + ' m³ (' + density + ' 株/公顷 × ' + rows.length + ' 级)</p>';
    }
    if (densityMu > 0) {
      html += '<p style="font-size:12px;color:var(--wood);">📐 亩合计: 总蓄积 ' + (rows.reduce(function(s,r){return s+r.volume;},0) * densityMu).toFixed(2) + ' m³ (' + densityMu + ' 株/亩 × ' + rows.length + ' 级)</p>';
    }
    html += '</div>';
  }

  html += '</div>';

  var container = document.getElementById('batchSummary');
  container.innerHTML = html;
  document.getElementById('batchCard').style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth' });
};