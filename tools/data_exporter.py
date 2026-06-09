#!/usr/bin/env python3
"""
数据导出工具
从 species-db.js 解析所有树种公式参数，导出为 JSON、CSV 和 Markdown 格式。
同时生成完整的项目数据报告。
"""
import re
import json
import csv
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional


ROOT = Path(__file__).resolve().parent.parent
SPECIES_DB = ROOT / "src" / "js" / "species-db.js"
EXPORTS_DIR = Path(__file__).resolve().parent / "exports"


@dataclass
class SpeciesData:
    id: str
    name: str
    latin: str
    a: float
    b: float
    c: float
    is_dynamic: bool
    b1: Optional[float] = None
    b2: Optional[float] = None
    c1: Optional[float] = None
    c2: Optional[float] = None
    source: str = ""
    reliability: str = ""
    note: str = ""
    yield_spec: float = 0.0
    yield_non_spec: float = 0.0
    yield_fuel: float = 0.0
    yield_waste: float = 0.0


def parse_species_db(filepath: Path) -> list[SpeciesData]:
    """从 species-db.js 解析 SPECIES 数组。"""
    text = filepath.read_text(encoding="utf-8")

    # 按 id 切割每个树种块
    blocks = re.split(r"(?=\{\s*\n\s*id:\s*')", text)
    species_list: list[SpeciesData] = []

    for block in blocks:
        id_m = re.search(r"id:\s*'([^']*)'", block)
        name_m = re.search(r"name:\s*'([^']*)'", block)
        latin_m = re.search(r"latin:\s*'([^']*)'", block)
        a_m = re.search(r"\ba:\s*([\d.eE+-]+)", block)
        is_dyn_m = re.search(r"isDynamic:\s*(true|false)", block)

        if not all([id_m, name_m, latin_m, a_m, is_dyn_m]):
            continue

        # 修复 b/c 匹配：用 \b 边界匹配，避免误匹配 b1/b2/c1/c2
        b_m = re.search(r"(?m)^\s*b:\s*([\d.eE+-]+)", block, re.MULTILINE)
        c_m = re.search(r"(?m)^\s*c:\s*([\d.eE+-]+)", block, re.MULTILINE)
        # 变指数模型：b/c 为 0 或不存在，此时用 isDynamic 判断
        b_val = float(b_m.group(1)) if b_m else 0.0
        c_val = float(c_m.group(1)) if c_m else 0.0

        sp = SpeciesData(
            id=id_m.group(1),
            name=name_m.group(1),
            latin=latin_m.group(1),
            a=float(a_m.group(1)),
            b=b_val,
            c=c_val,
            is_dynamic=is_dyn_m.group(1) == "true",
        )

        if sp.is_dynamic:
            b1_m = re.search(r"b1:\s*([\d.eE+-]+)", block)
            b2_m = re.search(r"b2:\s*([\d.eE+-]+)", block)
            c1_m = re.search(r"c1:\s*([\d.eE+-]+)", block)
            c2_m = re.search(r"c2:\s*([\d.eE+-]+)", block)
            sp.b1 = float(b1_m.group(1)) if b1_m else None
            sp.b2 = float(b2_m.group(1)) if b2_m else None
            sp.c1 = float(c1_m.group(1)) if c1_m else None
            sp.c2 = float(c2_m.group(1)) if c2_m else None

        src_m = re.search(r"source:\s*'([^']*)'", block)
        if src_m:
            sp.source = src_m.group(1)

        rel_m = re.search(r"reliability:\s*'([^']*)'", block)
        if rel_m:
            sp.reliability = rel_m.group(1)

        note_m = re.search(r"note:\s*'([^']*)'", block)
        if note_m:
            sp.note = note_m.group(1)

        # 解析出材率
        yr_m = re.search(
            r"yieldRates:\s*\{\s*spec:\s*([\d.]+),\s*nonSpec:\s*([\d.]+),"
            r"\s*fuel:\s*([\d.]+),\s*waste:\s*([\d.]+)",
            block
        )
        if yr_m:
            sp.yield_spec = float(yr_m.group(1))
            sp.yield_non_spec = float(yr_m.group(2))
            sp.yield_fuel = float(yr_m.group(3))
            sp.yield_waste = float(yr_m.group(4))

        species_list.append(sp)

    return species_list


def export_json(species_list: list[SpeciesData]) -> Path:
    path = EXPORTS_DIR / "species_data.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    data = [asdict(sp) for sp in species_list]
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"JSON 导出: {path}")
    return path


def export_csv(species_list: list[SpeciesData]) -> Path:
    path = EXPORTS_DIR / "species_data.csv"
    path.parent.mkdir(parents=True, exist_ok=True)

    fields = ["id", "name", "latin", "a", "b", "c", "is_dynamic",
              "b1", "b2", "c1", "c2", "source", "reliability",
              "yield_spec", "yield_non_spec", "yield_fuel", "yield_waste"]

    with path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for sp in species_list:
            writer.writerow(asdict(sp))

    print(f"CSV 导出: {path}")
    return path


def export_formula_md(species_list: list[SpeciesData]) -> Path:
    path = EXPORTS_DIR / "formula_reference.md"
    path.parent.mkdir(parents=True, exist_ok=True)

    lines = [
        "# 二元立木材积公式参考表",
        "",
        "## 固定指数模型 (V = a × D^b × H^c)",
        "",
        "| 树种 | a | b | c | 来源 | 可靠性 |",
        "|------|---|---|---|------|--------|",
    ]

    for sp in species_list:
        if not sp.is_dynamic and sp.a > 0:
            lines.append(
                f"| {sp.name} | {sp.a:.12f} | {sp.b:.6f} | {sp.c:.6f} "
                f"| {sp.source[:50]} | {sp.reliability} |"
            )

    lines += [
        "",
        "## 变指数模型 (V = a × D^(b1+b2×(D+H)) × H^(c1+c2×(D+H)))",
        "",
        "| 树种 | a | b1 | b2 | c1 | c2 | 来源 |",
        "|------|---|-----|-----|-----|-----|------|",
    ]

    for sp in species_list:
        if sp.is_dynamic and sp.a > 0:
            b1 = sp.b1 or 0
            b2 = sp.b2 or 0
            c1 = sp.c1 or 0
            c2 = sp.c2 or 0
            lines.append(
                f"| {sp.name} | {sp.a:.10f} | {b1:.6f} | {b2:.8f} "
                f"| {c1:.6f} | {c2:.8f} | {sp.source[:50]} |"
            )

    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Markdown 导出: {path}")
    return path


def export_complete_report(species_list: list[SpeciesData]) -> Path:
    path = EXPORTS_DIR / "complete_report.md"
    path.parent.mkdir(parents=True, exist_ok=True)

    # 统计
    total = len(species_list)
    high = sum(1 for s in species_list if s.reliability == "high")
    medium = sum(1 for s in species_list if s.reliability == "medium")
    low = sum(1 for s in species_list if s.reliability == "low")

    avg_spec = sum(s.yield_spec for s in species_list) / total if total else 0
    avg_non_spec = sum(s.yield_non_spec for s in species_list) / total if total else 0
    avg_fuel = sum(s.yield_fuel for s in species_list) / total if total else 0
    avg_waste = sum(s.yield_waste for s in species_list) / total if total else 0

    dynamic_count = sum(1 for s in species_list if s.is_dynamic)
    static_count = total - dynamic_count

    lines = [
        "# ForestCalculator 项目数据完整报告",
        "",
        f"树种总数: **{total}** | 固定指数模型: **{static_count}** | 变指数模型: **{dynamic_count}**",
        "",
        "## 可靠性分级统计",
        "",
        f"| 级别 | 数量 | 占比 |",
        f"|------|------|------|",
        f"| High (省标验证) | {high} | {high/total*100:.1f}% |",
        f"| Medium (部标/文献) | {medium} | {medium/total*100:.1f}% |",
        f"| Low (近似/待验证) | {low} | {low/total*100:.1f}% |",
        "",
        "## 出材率统计汇总",
        "",
        f"| 类型 | 平均出材率 |",
        f"|------|-----------|",
        f"| 规格材 | {avg_spec*100:.1f}% |",
        f"| 非规格材 | {avg_non_spec*100:.1f}% |",
        f"| 薪材 | {avg_fuel*100:.1f}% |",
        f"| 废材 | {avg_waste*100:.1f}% |",
        "",
        "## 所有树种参数一览",
        "",
        "| 序号 | 树种名称 | 学名 | 公式类型 | a | b | c | 可靠性 | 规格材% |",
        "|------|----------|------|----------|---|---|---|--------|---------|",
    ]

    for i, sp in enumerate(species_list, 1):
        ftype = "变指数" if sp.is_dynamic else "固定指数"
        lines.append(
            f"| {i} | {sp.name} | *{sp.latin}* | {ftype} | "
            f"{sp.a:.12f} | {sp.b:.6f} | {sp.c:.6f} | "
            f"{sp.reliability} | {sp.yield_spec*100:.0f}% |"
        )

    lines += [
        "",
        "## 标准文件覆盖情况",
        "",
        "| 标准编号 | 省份 | 状态 | 已集成公式 |",
        "|----------|------|------|-----------|",
        "| DB51/T 1466-2012 | 四川 | ✅ 全文 | 马尾松(DB51) |",
        "| DB51/T 1462-2012 | 四川 | ⚠️ 摘要 | 柳杉(DB51) |",
        "| DB51/T 1467-2012 | 四川 | ✅ | 柏木 |",
        "| DB52/T 703-2011 | 贵州 | ❌ 低质 | 马尾松(贵州) |",
        "| DB52/T 702-2011 | 贵州 | — | 杉木(贵州) |",
        "| DB52/T 773-2012 | 贵州 | — | 柏木(贵州) |",
        "| DB52/T 822-2013 | 贵州 | ⚠️ 扫描版 | 软阔(贵州) |",
        "| DB52/T 826-2013 | 贵州 | ✅ | 硬阔(贵州) |",
        "| DB35/T 1823-2019 | 福建 | ✅ 4公式 | 已集成（杉木福建/马尾松福建/阔叶树福建/其他针叶福建） |",
        "| DB53/T 1422.1-2025 | 云南 | ✅ OCR | 云南松(天然/人工) |",
        "| DB34/T 3345-2019 | 安徽 | ⚠️ FDIS | 未集成 |",
        "| 本地材积表 | — | ✅ | 马尾松(本地) + 柳杉(本地) |",
        "",
        "> 注: 福建 DB35/T 1823-2019 的 4 个公式仅在 HTML 面板展示，未加入 SPECIES 数组。",
        "> 建议后续版本将福建公式作为独立树种加入数据库。",
    ]

    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"完整报告: {path}")
    return path


def main() -> None:
    species_list = parse_species_db(SPECIES_DB)
    print(f"解析到 {len(species_list)} 个树种")

    export_json(species_list)
    export_csv(species_list)
    export_formula_md(species_list)
    export_complete_report(species_list)
    print("全部导出完成")


if __name__ == "__main__":
    main()