#!/usr/bin/env python3
"""
构建脚本
将 src/ 下的模块化文件打包为单个 HTML，可直接双击使用。
内联 CSS 和 JS，输出到 dist/ 目录。
"""
import hashlib
import json
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "src"
DIST_DIR = ROOT / "dist"
OUTPUT_FILE = DIST_DIR / "木材蓄积量计算器.html"
CACHE_FILE = DIST_DIR / ".build_cache.json"


def collect_sources(sources: list[Path]) -> str:
    """收集所有源文件的 SHA256 哈希。"""
    h = hashlib.sha256()
    for src in sorted(sources):
        if src.exists():
            h.update(src.read_bytes())
    return h.hexdigest()


def should_rebuild(sources: list[Path]) -> bool:
    """检查是否需要重新构建。"""
    if not OUTPUT_FILE.exists():
        return True
    if not CACHE_FILE.exists():
        return True

    try:
        cache = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        current = collect_sources(sources)
        return cache.get("hash") != current
    except (json.JSONDecodeError, KeyError):
        return True


def update_cache(sources: list[Path]) -> None:
    """更新构建缓存。"""
    CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    cache = {"hash": collect_sources(sources)}
    CACHE_FILE.write_text(json.dumps(cache, ensure_ascii=False), encoding="utf-8")


def inline_css(html: str, css_path: Path) -> str:
    """将 CSS link 标签替换为内联 style 标签。"""
    link_pattern = f'<link rel="stylesheet" href="{css_path.name}">'

    if link_pattern in html:
        css_content = css_path.read_text(encoding="utf-8")
        return html.replace(link_pattern, f"<style>\n{css_content}\n</style>")

    # 尝试相对路径
    rel_pattern = f'<link rel="stylesheet" href="css/{css_path.name}">'
    if rel_pattern in html:
        css_content = css_path.read_text(encoding="utf-8")
        return html.replace(rel_pattern, f"<style>\n{css_content}\n</style>")

    return html


def inline_js(html: str, js_path: Path, script_name: str) -> str:
    """将 script src 标签替换为内联 script 标签。"""
    patterns = [
        f'<script src="{script_name}"></script>',
        f'<script src="js/{script_name}"></script>',
    ]

    js_content = js_path.read_text(encoding="utf-8")

    for pat in patterns:
        if pat in html:
            return html.replace(pat, f"<script>\n{js_content}\n</script>")

    return html


def build() -> Optional[Path]:
    """执行构建，返回输出文件路径。"""
    index_html = SRC_DIR / "index.html"
    css_file = SRC_DIR / "css" / "style.css"
    js_dir = SRC_DIR / "js"

    js_files = [
        ("species-db.js", js_dir / "species-db.js"),
        ("storage.js", js_dir / "storage.js"),
        ("calculator.js", js_dir / "calculator.js"),
        ("ui.js", js_dir / "ui.js"),
        ("app.js", js_dir / "app.js"),
    ]

    # 收集所有源文件
    sources = [index_html, css_file] + [f for _, f in js_files]

    if not should_rebuild(sources):
        print("源文件未变更，跳过构建。")
        return OUTPUT_FILE

    # 读取 HTML
    html = index_html.read_text(encoding="utf-8")

    # 读取版本号并注入
    version_file = ROOT / "VERSION"
    if version_file.exists():
        version = version_file.read_text(encoding="utf-8").strip()
        html = html.replace("v1.1.0", f"v{version}")

    # 内联 CSS
    html = inline_css(html, css_file)

    # 内联 JS（按依赖顺序）
    for name, path in js_files:
        html = inline_js(html, path, name)

    # 写入输出
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(html, encoding="utf-8")

    # 同时生成 index.html 供 GitHub Pages 使用
    INDEX_FILE = DIST_DIR / "index.html"
    INDEX_FILE.write_text(html, encoding="utf-8")

    # 仓库根目录也生成 index.html（供分支部署模式）
    (ROOT / "index.html").write_text(html, encoding="utf-8")

    # 更新缓存
    update_cache(sources)

    size_kb = OUTPUT_FILE.stat().st_size / 1024
    print(f"构建完成: {OUTPUT_FILE} ({size_kb:.1f} KB), index.html ({size_kb:.1f} KB)")
    return OUTPUT_FILE


def main() -> None:
    result = build()
    if result:
        print("可直接双击 dist/木材蓄积量计算器.html 使用")


if __name__ == "__main__":
    main()