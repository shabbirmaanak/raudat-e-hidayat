#!/usr/bin/env python3
"""
Raudat-e-Hidayat Search Engine Server
Runs a local lightweight HTTP server and opens the app in your default browser.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = CustomHTTPRequestHandler
    for port in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", port), handler) as httpd:
                url = f"http://localhost:{port}/index.html"
                print(f"=====================================================")
                print(f"📖 Raudat-e-Hidayat Search Engine is running!")
                print(f"🌐 Access URL: {url}")
                print(f"⌨️  Press Ctrl+C to stop the server.")
                print(f"=====================================================")
                try:
                    webbrowser.open(url)
                except Exception:
                    pass
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
