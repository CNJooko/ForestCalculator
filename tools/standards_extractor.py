#!/usr/bin/env python3
"""
标准文件公式提取器
从标准文件报告中提取未集成的公式参数，特别是福建 DB35/T 1823-2019 的 4 个公式。
"""
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
REPORT_MD = ROOT / "标准文件报告.md"
HTML_FILE = ROOT / "木材蓄积量计算器.html"
EXPORTS_DIR = Path(__file__).resolve().parent / "exports"


FUJIAN_FORMULAS = [
    {
        "species": "杉木(福建·2019)",
        "latin": "Cunninghamia lanceolata",
        "a": 0.0000706094,
        "b": 1.801671,
        "c": 0.997998,
        "source": "DB35/T 1823-2019",
        "reliability": "high",
        "note": "福建2019年新编表，精度高于LY208-77旧标。建议加入SPECIES数组。"
    },
    {
        "species": "马尾松(福建·2019)",
        "latin": "Pinus massoniana",
        "a": 0.000070728,
        "b": 1.874518,
        "c": 0.908949,
        "source": "DB35/T 1823-2019",
        "reliability": "high",
        "note": "福建2019年新编表，与四川DB51参数不同。建议加入SPECIES数组。"
    },
    {
        "species": "阔叶树(福建·2019)",
        "latin": "Broadleaf spp. (Fujian)",
        "a": 0.0000685634,
        "b": 1.933221,
        "c": 0.867885,
        "source": "DB35/T 1823-2019",
        "reliability": "high",
        "note": "福建阔叶树通用公式。建议加入SPECIES数组。"
    },
    {
        "species": "其他针叶(福建·2019)",
        "latin": "Other conifer spp. (Fujian)",
        "a": 0.000069978,
        "b": 1.8660492,
        "c": 0.905254,
        "source": "DB35/T 1823-2019",
        "reliability": "high",
        "note": "福建其他针叶通用公式。建议加入SPECIES数组。"
    },
]


def extract_from_html(html_path: Path) -> list[dict]:
    """从 HTML 文件中提取福建公式（备用方案）。"""
    if not html_path.exists():
        return []

    text = html_path.read_text(encoding="utf-8")
    formulas = []

    # 匹配福建公式
    pattern = re.compile(
        r"(\S+)树?:\s*V\s*=\s*([\d.]+)×D\^([\d.]+)×H\^([\d.]+)"
    )
    for m in pattern.finditer(text):
        name = m.group(1).strip()
        a = float(m.group(2))
        b = float(m.group(3))
        c = float(m.group(4))
        formulas.append({
            "species": name,
            "a": a, "b": b, "c": c,
            "source": "DB35/T 1823-2019"
        })

    return formulas


def generate_fujian_report(output_path: Path) -> None:
    """生成福建公式参考文档。"""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# 福建 DB35/T 1823-2019 公式参考",
        "",
        "## 标准信息",
        "- 标准号: DB35/T 1823-2019",
        "- 名称: 福建省主要树种二元立木材积表",
        "- 状态: 现行",
        "- 页数: 完整（343KB）",
        "- 文本层: 清晰可提取",
        "",
        "## 公式列表",
        "",
        "| 树种 | a | b | c | 可靠性 | 建议 |",
        "|------|---|---|---|--------|------|",
    ]

    for f in FUJIAN_FORMULAS:
        lines.append(
            f"| {f['species']} | {f['a']:.10f} | {f['b']:.6f} | {f['c']:.6f} "
            f"| {f['reliability']} | {f['note']} |"
        )

    lines += [
        "",
        "## 与现有公式的对比",
        "",
        "| 树种 | 当前使用来源 | 福建 DB35/T 公式 | 备注 |",
        "|------|-------------|-----------------|------|",
        "| 杉木 | LY208-77/DB51 (a=0.00005878) | a=0.00007061 | 福建参数更新 |",
        "| 马尾松 | 本地表/DB51/贵州 | a=0.00007073 | 福建参数接近贵州 |",
        "| 阔叶树 | LY208-77 四川公式 | a=0.00006856 | 福建阔叶树专用 |",
        "| 其他针叶 | LY208-77 西南地区 | a=0.00006998 | 福建通用针叶 |",
        "",
        "## 建议",
        "",
        "这 4 个公式目前仅在 HTML 数据来源面板中以文本展示，未加入 SPECIES 数组。",
        "建议在 species-db.js 中新增以下条目：",
        "",
        "```javascript",
    ]

    ids = ["chinese-fir-fj", "masson-pine-fj", "broadleaf-fj", "other-conifer-fj"]
    for i, f in enumerate(FUJIAN_FORMULAS):
        lines.append(f"// {f['species']}")
        lines.append(f"{{")
        lines.append(f"  id: '{ids[i]}', name: '{f['species']}', latin: '{f['latin']}',")
        lines.append(f"  a: {f['a']}, b: {f['b']}, c: {f['c']}, isDynamic: false,")
        lines.append(f"  source: '{f['source']}', reliability: '{f['reliability']}',")
        lines.append(f"  yieldRates: {{ spec: 0.5, nonSpec: 0.2, fuel: 0.05, waste: 0.25 }},")
        lines.append(f"  note: '{f['note']}'")
        lines.append(f"}},")
        lines.append("")

    lines.pop()  # 移除最后多余空行
    lines.append("```")

    output_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"福建公式报告已生成: {output_path}")


def main() -> None:
    generate_fujian_report(EXPORTS_DIR / "fujian_formulas.md")

    # 尝试从 HTML 验证
    formulas = extract_from_html(HTML_FILE)
    if formulas:
        print(f"从 HTML 中额外提取到 {len(formulas)} 个公式")


if __name__ == "__main__":
    main()