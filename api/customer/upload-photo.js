const { randomUUID } = require("node:crypto");
const { send, getCustomerSession } = require("../_lib");
const { signObject } = require("../_storage");

module.exports.config = { api: { bodyParser: false } };
function readImage(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) { reject(new Error("A foto deve ter até 4 MB.")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
const allowed = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const customer = getCustomerSession(req);
  if (!customer) return send(res, 401, { error: "Entre na sua conta para enviar uma foto." });
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  const ext = allowed[contentType];
  if (!ext) return send(res, 400, { error: "Envie uma imagem JPG, PNG ou WEBP." });
  let fileName = String(req.headers["x-file-name"] || "foto-do-pedido");
  try { fileName = decodeURIComponent(fileName); } catch {}
  fileName = fileName.replace(/[\\/\\r\\n\\0]/g, "_").slice(0, 180) || "foto-do-pedido";
  try {
    const buffer = await readImage(req, 4 * 1024 * 1024);
    if (!buffer.length) return send(res, 400, { error: "O arquivo está vazio." });
    const key = customer.id + "/" + randomUUID() + "." + ext;
    const url = signObject("PUT", key, contentType, 300);
    const uploaded = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: buffer });
    if (!uploaded.ok) {
      console.error("Neon storage upload failed:", uploaded.status, await uploaded.text().catch(() => ""));
      return send(res, 502, { error: "Não foi possível armazenar a foto. Tente novamente." });
    }
    return send(res, 200, { key, name: fileName, content_type: contentType, size: buffer.length });
  } catch (error) {
    console.error("order photo upload failed:", error.message);
    return send(res, 500, { error: error.message || "Não foi possível enviar a foto." });
  }
};
