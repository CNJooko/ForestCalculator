# Changelog

## v1.7.4 (2026-06-09) — 性能优化专项：renderBatch() 增量更新

### 性能优化
- `ui.js` `renderBatch()`: 重写渲染逻辑，实现增量更新
  - 行元素缓存池（`_batchRowPool`）：复用已有 DOM 行，避免全量重建
  - 变更检测：通过 `dataset` 缓存行索引、树种、胸径、树高、株数，只重建变化行
  - `DocumentFragment` 批量更新：减少 Reflow 次数
  - 事件委托优化：只在行首次创建时绑定事件，后续只更新数据
- `style.css` `.table-wrap`: 添加 `max-height: 70vh` + `overflow-y: auto`，限制表格容器高度，避免大表格撑开页面导致滚动卡顿

### 性能提升（理论估算）
- 100 行数据：首次渲染提升 ~20-30%，增量更新提升 ~60-70%
- 500 行数据：首次渲染提升 ~30-40%，增量更新提升 ~70-80%
- 1000 行数据：首次渲染提升 ~40-50%，增量更新提升 ~80-90%

### 测试验证
- 功能兼容性：所有现有功能（单株计算、批量计算、CSV 导入、收方表、跨省对比）均正常
- 性能测试页面：`temp/performance_test.html`（模拟测试，非真实数据）

## v1.7.3 (2026-06-09) — 架构审计与缺陷修复

### 缺陷修复（BUG）
- `ui.js` `calcBatch()`: 自定义出材率逻辑与 `calcSingle` 不一致，改为直接传参调用 `calcYieldRates()`，解耦 DOM
- `ui.js` `showCompare()`: 硬编码树种 ID 列表改为动态分组，自动适配 SPECIES 数组变化
- `tools/data_exporter.py`: `b/c` 正则误匹配 `b1/b2/c1/c2`，改用 `^\s*b:` / `^\s*c:` 行首匹配修复
- `tools/data_exporter.py`: 福建公式描述错误（"⚠️ 未集成" → "已集成"）
- `tests/test_calculator.py`: 函数名 `test_all_24_econBase_species` → `test_all_24_species_econBase`（字母序）
- `index.html`: footer 版本号占位符 `__VERSION__` 未替换，改为 `v1.7.3`

### 架构改进
- `ui.js`: `calcBatch` 中 `yTotalVal` 默认值逻辑修复（`|| 75` 会覆盖 `NaN` 判断）
- `calculator.js`: `calcYieldRates()` 已支持自定义出材率传参，纯函数版本统一接口

### 测试
- 所有单元测试通过（Python unittest）

## v1.7.2 (2026-06-09) — 代码质量与文档更新

### 代码质量
- `calculator.js`: `calcSingle()` 中 `getYieldRates()` DOM 依赖解耦，改为传参调用 `calcYieldRates()`，与 `calcBatch` 保持一致
- `species-db.js`: 福建树种 note 字段验证点标注精确值（原标注为近似值，易误导）

### 文档
- `README.md`: 更新功能列表，补充 v1.5+ 新增功能（动态出材率、跨省对比、收方表、变指数模型等）
- `CHANGELOG.md`: 新增 v1.7.2 条目

### UI/样式
- `style.css`: `cols-4` 平板断点从 900px 下调至 768px，优化平板竖屏体验

## v1.7.1 (2026-06-07) — 测试扩展与源码文档化

- 测试覆盖：新增 TestBoundaryInputs（5 边界值）、TestYieldRateBounds（出材率总和+物种数量）、TestBatchLogic（批量逻辑验证）共 9 项测试
- JSDoc：补充 species-db.js 中 getActiveSpecies/getCustomSpecies 的 JSDoc 注释（calculator.js 已有完整注释）
- 出材率 delta 收紧：test_yield_sum_equals_one 从 0.02 → 0.005

## v1.7.0 (2026-06-07) — a11y无障碍、移动端响应式、错误边界、use strict、暗色模式CSS变量收敛

- a11y Phase A：结果面板 aria-live、Toast role="alert"、Confirm 模态 role="dialog"+aria-modal、关键输入框 aria-label、:focus-visible 焦点环
- 移动端响应式：cols-4 改用 auto-fit minmax、批量表格溢出滚动（已有）、600px 断点移动端字体适配
- 全局错误边界：window.onerror 捕获未处理异常并 Toast 提示
- 全部 5 个 JS 文件添加 `'use strict'` 声明
- 暗色模式 CSS 变量收敛：volume-hero / area-hero 硬编码 rgba 改为 --hero-vol-dark / --hero-area-dark

## v1.6.2 (2026-06-07) — 健壮性修补与 CI 修正

- CI 工作流修正：`upload-pages-artifact@v3` → `upload-artifact@v4`（移除无 deploy job 的 Pages 专属 action），清理末尾多余空行
- parseFloat NaN 兜底：`calcBatch` 中 `yTotalVal` 增加 `|| 75` 回退默认值
- 主题存储异常处理：`toggleTheme` 中 `localStorage.setItem('fc_theme', ...)` 包裹 try/catch
- 版本号同步至 v1.6.2（VERSION / index.html footer）

## v1.6.1 (2026-06-07) — 安全性修补与数据修正

- P0 存储型 XSS 修复：renderHistory 中 h.species 增加 escapeHTML 转义
- P1 安徽马尾松系数修正：a 从 0.000062599 → 0.0000623418，期望值 0.231→0.207m³
- P1 README.txt 同步：重写为 24 个树种、多省标准、启动方式指 dist/，移除"AI写的"
- P1 addHistory 异常处理：localStorage.setItem 包裹 try/catch

## v1.6.0 (2026-06-06) — 健壮性与交互优化

- 撤销栈覆盖行内 D/H/株数编辑（撤销后不会丢失最近修改）
- Toast 添加 × 手动关闭按钮
- Confirm 模态框支持 Enter/Esc 键盘操作
- calcVolume 入参边界校验（NaN/Infinity/负数安全返回 0）
- CSV 导入上限 500 行，超出截断并提示
- 收方表公顷/亩合计标注"理论最大值"

## v1.5.9 (2026-06-06) — UI体验优化

- 暗色模式覆盖 12 个硬编码亮色元素（yield-item / tbody / callout / badge / volume-hero / area-hero / thead / species-bar / yield-label / footer）
- getYieldRates() DOM 解耦：拆分为纯函数 calcYieldRates() + 兼容包装层
- 批量汇总补充完整亩均统计（规格材/非规格材/薪材/废材逐项展示）

## v1.5.8 (2026-06-05)

- 为12个缺失 econBasePct 的树种补充基准经济材率（栎类/软阔/云南松/杨树/福建树种等）
- 修复批量汇总"公顷合计"计算逻辑：改为单株平均×密度

## v1.5.7 (2026-06-05) — 文档同步

- 🔧 README.md 树种数量修正 23→24（与 species-db.js 一致）
- 🔧 complete_report.md / fujian_formulas.md 更新：移除已完成的"建议加入"标记
- 🔧 formula_reference.md 补充安徽马尾松参数
- 🔧 test_calculator.py 方法名修正 test_all_23 → test_all_24
- 🗑️ 清理孤立旧文件（根目录旧版 HTML、空 test_output.txt）

## [1.5.6] - 2026-06-05

### Fixed
- getActiveSpecies null 安全：选择框值越界或自定义物种为空时兜底返回 SPECIES[0]，防止 calcSingle 崩溃
- 暗色模式批量汇总行背景：`.summary-row td` 硬编码亮色渐变，dark 模式补 `!important` 暗色覆盖
- addRow 默认树种：从硬编码 speciesIdx=0 改为读取当前选中树种索引

## [1.5.5] - 2026-06-05

### Fixed
- copyBatchRow 补 `_pushUndo()`：复制行操作缺失撤销快照，与 v1.5.2 承诺的 7 处全覆盖矛盾
- getYieldRates 废材率下限：自定义出材率接近 1 时 `waste` 可为负值，现 clamp 至 0
- storage.js 三个 localStorage 操作补 try/catch：saveCustomToStorage、addHistory、clearHistory 存储满时静默降级

## [1.5.4] - 2026-06-04

### Fixed
- calcBatch 自定义出材率性能：`isCustomYield` 预检测提至循环外，避免逐行重复读取 DOM
- 批量行内联树种下拉缺失 `_pushUndo()`：onchange 事件前显式推快照
- 批量行胸径失焦不自动填高：新增 `autoFillBatchHeight(idx)` 函数，DBH 输入框绑定 onblur

## [1.5.3] - 2026-06-04

### Added
- 批量计算支持自定义综合出材率：calcBatch 在 getYieldRates 检测到自定义值后覆盖 calcYield 的动态出材率

### Fixed
- build.py 版本注入方式：从硬编码 `v1.1.0` 替换改为 `__VERSION__` 令牌替换，消除构建产物版本号滞留

### Removed
- calculator.js 中死代码 `exportYieldCSV`（被 ui.js 同名函数覆盖，从未执行）

## [1.5.2] - 2026-06-04

### Fixed
- 补全撤销栈覆盖：addRow、addToBatch、copyBatchRow 操作前新增 `_pushUndo()`
  - 至此 7 处破坏性操作（新增/删除/清空/导入/复制/移动）全部纳入撤销栈

## [1.5.1] - 2026-06-04

### Fixed
- CSV 导入适配株数模式：直接推单行含 count，不再循环生成冗余行
- 移除 `_lastBatchLen` 残留（v1.4.6 应删未删的冗余变量）

## [1.5.0] - 2026-06-04

### Added
- 批量行株数列：每行新增株数输入框（默认1），计算/导出/统计均按株数倍增
- DBH 自动填高：输入胸径失去焦点时，自动根据树种高径比填入树高
- Esc 快捷键：关闭浮动面板（CSV粘贴导入、收方表参数）

### Changed
- 批量汇总表头：显示「N 株，M 行」区分总株数和行数
- addToBatch 逻辑：由循环推多行改为单行含株数，大幅减少冗余行

## [1.4.9] - 2026-06-04

### Fixed
- Bug: 批量行删除按钮未记录撤销快照，导致 Ctrl+Z/撤销按钮无法恢复被删行

### Added
- Ctrl+Z 快捷键：在非输入区按 Ctrl+Z 触发撤销批量操作
- 树种默认收方表范围：每个树种新增 yieldDMin/yieldDMax，针叶 6-40、阔叶 6-50、栎类 6-60
- 收方表标题显示 H/D 比来源说明（树种默认 / 用户自定义）

### Changed
- 收方表面板打开时 D 范围自动填入当前树种默认值
- 切换树种时若收方表面板可见，D 范围同步更新

## [1.4.8] - 2026-06-04

### Added
- 树种专属高径比：每个树种新增 defaultHRatio 字段，收方表生成时自动使用树种默认值
- 批量工具栏行数：工具栏显示「共 N 行」，实时反映批量数据量
- Ctrl+Enter 快捷键：单株计算区按 Ctrl+Enter 直接将当前参数添加到批量列表

### Changed
- 收方表面板打开时 H/D 比自动填入当前树种默认值，而非固定 0.75
- 切换树种时若收方表面板可见，H/D 比同步更新为当前树种默认值

## [1.4.7] - 2026-06-04

### Added
- 批量行排序：每行操作列新增 ↑↓ 按钮，支持上下移动调整顺序
- 清除单株结果：单株计算区域新增「✕ 清除结果」按钮
- 批量摘要按树种分组：计算后自动按树种汇总株数、总蓄积、规格材等

### Changed
- 批量行树种变更时，若汇总已显示则自动重算；否则仅清空该行缓存

## [1.4.6] - 2026-06-04

### Fixed
- Bug: Toast/Confirm CSS 样式仅在 dist/ 内联而 src/css/style.css 缺失，导致 rebuild 后样式丢失。已将完整 Toast/Confirm CSS 同步回 src/css/style.css（含暗色模式）
- Bug: 撤销栈记录的是删除后的状态而非删除前状态，导致撤销无效。修复方案：移除 renderBatch 中的自动入栈逻辑，改为在 addRow、addToBatch、clearBatch、importCSV、删除按钮等破坏性操作前显式 push 快照
- Bug: 收方表参数面板缺少 H/D 比输入框（#hRatioYield），showYieldTable 读取不到该值。已在 yieldTableOptions 中补全

## [1.4.5] - 2026-06-04

### Added
- Toast 通知系统：替换所有 alert() 为自定义非阻塞 toast（`ForestCalc.showToast`），支持 info/warn/error/success 四种类型，毛玻璃背景 + 彩色边缘 + 3s 自动淡出
- Confirm 模态框：替换所有 confirm() 为自定义 `ForestCalc.showConfirm`，居中模态遮罩层 + 确定/取消按钮
- 批量模式 CSV 粘贴导入：工具栏新增"粘贴导入"按钮，支持 textarea 粘贴（2列: 胸径,树高 / 3列: 胸径,树高,株数），追加模式，忽略注释行
- 树种下拉框搜索过滤：speciesSelect 上方新增文本搜索框，实时过滤下拉选项
- 批量行删除撤销：维护 `_undoStack`（最多10个快照），工具栏新增"↩ 撤销"按钮，batchRows 长度变化时自动入栈
- 批量工具栏新增"导出CSV"快捷按钮

### Changed
- 所有 alert() / confirm() 调用已替换为 Toast / Confirm 系统（共 11 处 alert + 2 处 confirm）

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