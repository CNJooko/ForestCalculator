## 缺陷修复（BUG）
- `ui.js` `calcBatch()`: 自定义出材率逻辑与 `calcSingle` 不一致，改为直接传参调用 `calcYieldRates()`，解耦 DOM
- `ui.js` `showCompare()`: 硬编码树种 ID 列表改为动态分组，自动适配 SPECIES 数组变化
- `tools/data_exporter.py`: `b/c` 正则误匹配 `b1/b2/c1/c2`，改用 `^\s*b:` / `^\s*c:` 行首匹配修复
- `tools/data_exporter.py`: 福建公式描述错误（"⚠️ 未集成" → "已集成"）
- `tests/test_calculator.py`: 函数名字母序修复
- `index.html`: footer 版本号占位符修复

## 架构改进
- `ui.js`: `calcBatch` 中 `yTotalVal` 默认值逻辑修复
- `calculator.js`: `calcYieldRates()` 已支持自定义出材率传参，纯函数版本统一接口

## 测试
- 所有单元测试通过（Python unittest）