#!/usr/bin/env node
/** Local preview with /{publication-id} routes (not plain python http.server). */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { idForSlot, loadRegistry } from "./transmission-slots.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.WEBSITE_PORT || "8080");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xml": "application/atom+xml; charset=utf-8",
};

const ID_RE = /^\/[a-f0-9]{16}\d+\/?$/i;
const SLOT_RE = /^\/\d+\/?$/;

function sendFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(status, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  res.end(fs.readFileSync(filePath));
}

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url || "/", `http://127.0.0.1:${PORT}`).pathname);

  if (urlPath === "/" || urlPath === "") {
    sendFile(res, path.join(ROOT, "index.html"));
    return;
  }

  if (SLOT_RE.test(urlPath)) {
    const slot = Number(urlPath.replace(/\//g, ""));
    const id = idForSlot(loadRegistry(), slot);
    if (id) {
      res.writeHead(302, { Location: `/${id}/` });
      res.end();
      return;
    }
    res.writeHead(404);
    res.end("Unknown transmission slot");
    return;
  }

  if (ID_RE.test(urlPath)) {
    const id = urlPath.replace(/\//g, "").toLowerCase();
    const perId = path.join(ROOT, id, "index.html");
    const fallback = path.join(ROOT, "comic", "id-page.html");
    if (fs.existsSync(perId)) sendFile(res, perId);
    else if (fs.existsSync(fallback)) sendFile(res, fallback);
    else {
      res.writeHead(404);
      res.end("Comic page missing");
    }
    return;
  }

  const filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    sendFile(res, filePath);
    return;
  }

  const withIndex = path.join(filePath, "index.html");
  if (fs.existsSync(withIndex)) {
    sendFile(res, withIndex);
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Website: http://127.0.0.1:${PORT}/`);
  console.log(`Comic example: http://127.0.0.1:${PORT}/ad5ba57c25217bfe1`);
});
