'use strict';

// ========== 应用入口 — 事件绑定与初始化 ==========
// 依赖 species-db.js, storage.js, calculator.js, ui.js

window.onerror = function(msg, url, line) {
    console.error('ForestCalculator Error:', msg, 'at', url, 'line', line);
    var toast = document.createElement('div');
    toast.className = 'toast toast-error';
    toast.textContent = '程序遇到错误，请刷新页面后重试';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 5000);
    return false;
};

// 页面加载完成后初始化应用和绑定事件
document.addEventListener('DOMContentLoaded', function() {
  ForestCalc.initApp();
});