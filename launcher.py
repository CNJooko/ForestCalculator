#!/usr/bin/env python3
"""快速启动服务器，在浏览器中打开计算器。"""
import webbrowser
import http.server
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC_DIR = ROOT / "src"
PORT = 8765

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SRC_DIR), **kwargs)

if __name__ == "__main__":
    url = f"http://localhost:{PORT}/index.html"
    print(f"ForestCalculator 启动于 {url}")
    webbrowser.open(url)
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止")