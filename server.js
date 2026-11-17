const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const routes = {
  "/api/admin/login": "./api/admin/login.js",
  "/api/admin/logout": "./api/admin/logout.js",
  "/api/admin/register": "./api/admin/register.js",
  "/api/admin/orders": "./api/admin/orders.js",
  "/api/admin/session": "./api/admin/session.js",
  "/api/customer/login": "./api/customer/login.js",
  "/api/customer/logout": "./api/customer/logout.js",
  "/api/customer/register": "./api/customer/register.js",
  "/api/customer/orders": "./api/customer/orders.js",
  "/api/customer/cancel-order": "./api/customer/cancel-order.js",
  "/api/customer/upload-photo": "./api/customer/upload-photo.js",
  "/api/admin/order-attachment": "./api/admin/order-attachment.js",
  "/api/customer/session": "./api/customer/session.js",
  "/api/orders": "./api/orders.js"
};
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".webp":"image/webp", ".ico":"image/x-icon", ".json":"application/json; charset=utf-8" };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) { reject(new Error("Corpo da requisição muito grande.")); req.destroy(); }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try { resolve(JSON.parse(body)); } catch { reject(new Error("JSON inválido.")); }
    });
    req.on("error", reject);
  });
}
function sendError(res, status, message) {
  res.writeHead(status, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
  res.end(JSON.stringify({ error: message }));
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const route = routes[url.pathname.replace(/\/$/, "") || "/"];
  req.query = Object.fromEntries(url.searchParams.entries());
  if (route) {
    try {
      if (url.pathname !== "/api/customer/upload-photo" && ["POST","PATCH","PUT"].includes(req.method)) req.body = await readBody(req);
      else req.body = {};
      return await require(route)(req, res);
    } catch (error) {
      console.error("Local API error:", error.message);
      return sendError(res, error.message.includes("JSON") ? 400 : 500, error.message || "Erro interno.");
    }
  }
  if (!["GET","HEAD"].includes(req.method)) return sendError(res, 405, "Método não permitido.");
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return sendError(res, 400, "Caminho inválido."); }
  if (pathname === "/") pathname = "/index.html";
  let target = path.resolve(root, "." + pathname);
  if (!target.startsWith(root + path.sep) && target !== root) return sendError(res, 403, "Acesso negado.");
  try {
    let stat = fs.statSync(target);
    if (stat.isDirectory()) target = path.join(target, "index.html");
    const data = fs.readFileSync(target);
    res.writeHead(200, { "Content-Type": types[path.extname(target).toLowerCase()] || "application/octet-stream", "X-Content-Type-Options":"nosniff" });
    return res.end(req.method === "HEAD" ? undefined : data);
  } catch {
    return sendError(res, 404, "Página ou arquivo não encontrado.");
  }
});
server.listen(port, () => console.log("Papagaio Verde local em http://localhost:" + port));
