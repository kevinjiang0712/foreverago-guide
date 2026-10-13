"""Serve the exact static export locally, including clean URLs and real 404s."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class ExportPreview(SimpleHTTPRequestHandler):
    def send_head(self):
        requested_path = unquote(urlsplit(self.path).path)
        if "\x00" in requested_path or ".." in Path(requested_path).parts:
            self.send_error(400, "Invalid preview path")
            return None
        export_root = Path(self.directory).resolve()
        requested_file = export_root / requested_path.lstrip("/")
        candidates = [requested_file, Path(str(requested_file) + ".html"), requested_file / "index.html"]
        for candidate in candidates:
            if candidate.is_file() and candidate.resolve().is_relative_to(export_root):
                self.path = "/" + candidate.relative_to(export_root).as_posix()
                return super().send_head()
        missing_page = export_root / "404.html"
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(missing_page.stat().st_size))
        self.end_headers()
        return missing_page.open("rb")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3189)
    parser.add_argument("--directory", default="out")
    arguments = parser.parse_args()
    export_directory = Path(arguments.directory).resolve()
    if not (export_directory / "index.html").is_file() or not (export_directory / "404.html").is_file():
        raise FileNotFoundError(f"Missing static export index.html or 404.html in {export_directory}")
    server = ThreadingHTTPServer(("127.0.0.1", arguments.port), partial(ExportPreview, directory=str(export_directory)))
    print(f"Static release preview: http://127.0.0.1:{arguments.port}", flush=True)
    server.serve_forever()
