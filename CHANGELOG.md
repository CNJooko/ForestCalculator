# Changelog

## [1.4.4] - 2026-06-04

### Fixed
- CHANGELOG 结构修复：v1.4.3 节中混入的 v1.4.2 改动已分离为独立节

### Added
- 键盘快捷键：D/H 输入框支持 Enter 键触发计算（D 有值但 H 为空时聚焦 H）
- 批量表格行复制：每行新增"复制"按钮，点击复制当前行数据并插入下方

## [1.4.3] - 2026-06-04

### Fixed
- 收方表 CSV 导出无数据：`exportYieldCSV()` 读取 `_yieldTableData` 但 `showYieldTable()` 未赋值，现生成后立即存储
- 收方表 CSV 导出按钮 onclick 传参冗余：改为无参调用 `ForestCalc.exportYieldCSV()`

### Added
- 收方表 H/D 比可调：参数面板新增 H/D 比输入框（默认 0.75，范围 0.5~1.2），标题和计算均动态读取

### Changed
- CI 精简：移除 deploy job（因 `environment: github-pages` 缺失持续失败），站点走分支部署模式
- 打印样式优化：收方表 `#yieldTablePanel` 和跨省对比 `#comparePanel` 在打印时完整显示，A4 纵向，表格文字 11px，隐藏所有交互元素

## [1.4.2] - 2026-06-03

### Fixed
- batch 模式 calcYield 未传递 dbh/height：修正 calcBatch 调用，每行按实际径级计算动态出材率
- showCompare 覆盖 batchSummary：新增独立 comparePanel 容器，防止对比结果覆盖批量计算结果

### Added
- 收方表 CSV 导出：收方表标题旁新增"导出 CSV"按钮，支持 BOM + UTF-8 中文表头
- 新树种：安徽马尾松 (DB34/T 3345-2019)，二元立木材积公式参数 a=0.000062599 b=1.875389 c=0.918393

## [1.4.1] - 2026-06-03

### Fixed
- 收方表按钮点击无反应：HTML 缺少 `yieldTableOptions` 参数面板及 D 范围/步长输入框，JS `showYieldTable()` 访问 null 对象导致 TypeError 崩溃

## [1.4.0] - 2026-06-03

### Added
- 收方表生成功能（按胸径分级生成完整蓄积量对照表）
- 打印样式（@media print，A4 横向，隐藏交互元素）
- GitHub Actions CI（自动测试 + 构建 + Pages 部署）

### Changed
- 版本号跃升至 1.4.0（重大功能新增）

## [1.3.4] - 2026-06-03

### Fixed
- 福建回归验证器期望值从近似值更新为公式精确值，偏差 <1%

### Added
- 亩蓄积量计算模式（每公顷株数模式之外新增每亩株数模式）
- 批量计算统计摘要（平均值/最小值/最大值）

### Changed
- 批量计算表格增加统计摘要区域

## [1.3.3] - 2026-06-03

### Fixed
- 修复福建回归验证器公式参数与 species-db.js 不一致导致的 8-12% 偏差
- 福建 4 树种验证偏差从最高 12% 降至 <2%

### Added
- 批量计算支持公顷模式（表格底部显示公顷合计行）
- 公顷蓄积量单元测试

### Changed
- 测试总数 31 → 32

## [1.3.2] - 2026-06-03

### Added
- 公顷蓄积量计算功能（输入每公顷株数，自动计算公顷级总蓄积及各材种）
- 出材率新旧系统对比审计报告 (tools/yield_rate_audit.md)
- 出材率回归验证器扩展（福建 4 树种 D=20 H=15 验证点）

### Changed
- 回归验证器覆盖 4 省标准（四川/贵州/福建 + 本地表）

## [1.3.1] - 2026-06-02

### Added
- 出材率单元测试（TestYieldRatesDynamic，6 个测试用例，含 23 树种全量 + 大小径级对比）
- 跨省标准对比功能（马尾松/杉木/柏木/阔叶树 4 组，点击"📊 跨省对比"按钮）
- 计算结果中显示树种 econBasePct 来源与斜率信息

### Changed
- 测试总数 25 → 31

## [1.3.0] - 2026-06-01

### Changed
- **出材率系统重构**: scaleBySpecies 暗箱缩放 → 逐树种显式 econBasePct 基准
  - 每树种独立定义 D=20 H=15 时的基准经济材率%
  - D/H 敏感性沿用 DB51/T 1466 马尾松 153 点回归斜率（R²=0.977）
  - 全部 23 树种基准值均有林学依据或经验参考
  - 裁剪范围扩至 50-92%（原 65-90%），减少边界撞墙

## [1.2.0] - 2026-06-01

### Added
- 版本管理体系（VERSION 文件 + UI footer 版本号 + build.py 注入）
- CHANGELOG.md 变更记录
- 福建树种验证点（D=20 H=15 实测值写入 note）
- 福建树种单元测试（+4，总计 25 个）

### Fixed
- 柏木 DB51/T 1467 公式偏差警告修正（实测 D=20 H=15.5 → 0.205m³，与标准一致，原"0.507"为计算误报）

### Changed
- 构建产物版本号自动从 VERSION 文件注入

## [1.1.0] - 2026-06-01

### Added
- 福建 DB35/T 1823-2019 标准集成（杉木/马尾松/阔叶树/其他针叶，共 4 树种）
- 暗色主题支持（右下角悬浮切换按钮，状态持久化）
- 批量计算 CSV 导出功能
- Python 一键启动器（launcher.py）
- dist/ 构建缓存机制（增量构建）

### Changed
- 源码模块化拆分（src/index.html → 7 个文件）
- 树种总数 19 → 23
- 构建产物从 49KB → 57KB

### Added (工具链)
- tools/regression_validator.py — 公式回归验证
- tools/data_exporter.py — JSON/CSV/Markdown 数据导出
- tools/standards_extractor.py — 标准公式提取
- build.py — 单文件打包构建
- tests/test_calculator.py — 21 个单元测试

## [1.0.0] - 此前版本

- 初始版本：单体 HTML，19 个树种，动态出材率
- 标准文件库（10 份 PDF + 2 份 Excel）