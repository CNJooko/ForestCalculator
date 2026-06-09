# 木材蓄积量与出材量计算器 (ForestCalculator)

双击 `src/index.html` 或 `dist/木材蓄积量计算器.html` 即可使用。

## 功能

- 24 个预置树种，覆盖四川/贵州/福建/云南/安徽五省标准
- 两种材积模型：固定指数（V=a·D^b·H^c）和变指数（b/c 随 D+H 动态变化）
- 动态出材率系统：按胸径和树高自动调整经济材率（econBasePct），更贴近实际
- 单株计算：蓄积量 + 出材量（规格材/非规格材/薪材/废材），支持公顷/亩蓄积量统计
- 批量采伐汇总：逐行添加或 CSV 粘贴导入，自动汇总并生成收方表
- 跨省标准对比：并排对比同一树种在不同省份标准下的材积差异
- 自定义树种公式：保存 a/b/c 系数到 localStorage，跨会话持久化
- 计算历史记录：自动保存最近 50 条计算记录，支持回溯
- 暗色/亮色主题切换，尊重系统偏好（prefers-color-scheme）
- 移动端响应式适配（600px / 768px / 900px 三档断点）
- a11y 无障碍：ARIA 标签、焦点可见、Toast 通知 role=alert
- 支持多省标准（四川 DB51 / 贵州 DB52 / 福建 DB35 / 云南 DB53 / 安徽 DB34 / 部标 LY208-77）

## 项目结构

```
ForestCalculator/
├── src/                        # 模块化源码
│   ├── index.html              # HTML 结构
│   ├── css/style.css           # 样式表
│   └── js/
│       ├── species-db.js       # 树种数据库（24个树种参数）
│       ├── storage.js          # localStorage 持久化
│       ├── calculator.js       # 核心计算公式
│       ├── ui.js               # UI 渲染与交互
│       └── app.js              # 入口初始化
│
├── tools/                      # Python 工具链
│   ├── regression_validator.py    # 公式回归验证
│   ├── data_exporter.py           # 数据导出（JSON/CSV/MD）
│   ├── standards_extractor.py     # 标准公式提取
│   └── exports/                   # 导出产物
│
├── tests/                      # 单元测试
│   └── test_calculator.py      # 42 个测试用例（unittest）
│
├── launcher.py                 # 一键启动本地服务器
├── build.py                    # 构建脚本（打包为单文件 HTML）
├── dist/                       # 构建产物（单文件版本）
├── standards/                  # 参考标准文件（10 份 PDF + 2 份 Excel）
├── 木材蓄积量计算器.html       # 原始单文件（保留兼容）
├── 标准文件报告.md             # 标准文件可靠性报告
├── VERSION                     # 版本号
├── CHANGELOG.md                # 变更记录
└── icon.ico                    # 应用图标
```

## 快速开始

```bash
# 一键启动（浏览器中预览）
python launcher.py

# 运行测试
python tests/test_calculator.py

# 运行公式验证
python tools/regression_validator.py

# 导出数据
python tools/data_exporter.py

# 提取标准公式
python tools/standards_extractor.py

# 构建单文件版本
python build.py
```

## 数据来源

| 标准 | 省份 | 集成状态 |
|------|------|----------|
| DB51/T 1466-2012 | 四川 | ✅ 马尾松 |
| DB51/T 1462-2012 | 四川 | ✅ 柳杉 |
| DB51/T 1467-2012 | 四川 | ✅ 柏木 |
| DB52/T 702-2011 | 贵州 | ✅ 杉木(变指数) |
| DB52/T 703-2011 | 贵州 | ✅ 马尾松 |
| DB52/T 773-2012 | 贵州 | ✅ 柏木(变指数) |
| DB52/T 822-2013 | 贵州 | ✅ 软阔(变指数) |
| DB52/T 826-2013 | 贵州 | ✅ 硬阔(变指数) |
| DB53/T 1422.1-2025 | 云南 | ✅ 云南松(天然/人工) |
| DB35/T 1823-2019 | 福建 | ✅ 杉木/马尾松/阔叶树/其他针叶 |
| LY208-77 | 部标 | ✅ 华山松/栎类/桤木/杨树/软阔/硬阔 |

## 出材率说明

马尾松出材率基于 DB51/T 1466 B.1 表 153 点回归 (R²=0.977)。其余树种按相对马尾松的林学规律等比缩放。精确出材率需查阅对应标准的单木出材率表（按胸径树高分段内插）。