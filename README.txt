# 木材蓄积量与出材量计算器 (ForestCalculator)

双击 dist/木材蓄积量计算器.html 即可使用。
右键 → 发送到桌面 → 创建桌面快捷方式。

## 功能
- 24 个预置树种 + 自定义公式
- 动态出材率（DB51 实测验证，马尾松 R²=0.977）
- 批量汇总 + 亩均统计 + 计算历史记录
- 支持多省标准（四川/贵州/福建/云南/安徽）
- 固定指数 + 变指数两种模型

## 项目结构
ForestCalculator/
  src/              模块化源码 (index.html + css/ + js/)
  tools/            Python 工具链 (回归验证/数据导出/标准提取)
  tests/            单元测试 (29 个用例)
  dist/             构建产物 (单文件 HTML)
  standards/        参考标准文件 (PDF/Excel)
  build.py          构建脚本
  launcher.py       一键启动本地服务器

## 快速开始
python launcher.py                 # 浏览器预览
python tests/test_calculator.py    # 运行测试
python tools/regression_validator.py  # 公式验证
python tools/data_exporter.py      # 数据导出
python build.py                    # 构建单文件

## 数据来源
四川 DB51/T 1462~1467, 贵州 DB52/T 702~826, 福建 DB35/T 1823, 云南 DB53/T 1422.1, 安徽 DB34/T 3345, 部标 LY208-77

## 要求
需要 Chrome 或 Firefox 浏览器
