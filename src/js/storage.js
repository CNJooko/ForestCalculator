// ========== 本地存储操作（纯数据读写，无 DOM 操作） ==========
// 依赖 species-db.js 中的 ForestCalc.STORAGE_KEY、ForestCalc.HIST_KEY

var ForestCalc = window.ForestCalc || {};

// ========== 自定义公式存储 ==========
ForestCalc.loadSavedCustoms = function() {
  try { return JSON.parse(localStorage.getItem(ForestCalc.STORAGE_KEY) || '[]'); } catch(e) { return []; }
};

ForestCalc.saveCustomToStorage = function(data) {
  try { localStorage.setItem(ForestCalc.STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
};

// ========== 计算历史存储 ==========
ForestCalc.loadHistory = function() {
  try { return JSON.parse(localStorage.getItem(ForestCalc.HIST_KEY) || '[]'); } catch(e) { return []; }
};

ForestCalc.addHistory = function(speciesName, dbh, height, count, vol, econ) {
  var hist = ForestCalc.loadHistory();
  hist.unshift({ species: speciesName, dbh: dbh, height: height, count: count, vol: vol.toFixed(4), econ: econ.toFixed(4), time: new Date().toLocaleString() });
  if (hist.length > 50) hist.length = 50;
  localStorage.setItem(ForestCalc.HIST_KEY, JSON.stringify(hist));
};

ForestCalc.clearHistory = function() {
  try { localStorage.removeItem(ForestCalc.HIST_KEY); } catch(e) {}
};