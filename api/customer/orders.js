const { db, send, getCustomerSession } = require("../_lib");
const { randomUUID } = require("node:crypto");
const { signObject } = require("../../lib/storage");

module.exports.config = { api: { bodyParser: false } };
function readRaw(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on("data", chunk => {
      size += chunk.length;
      if (size > maxBytes) { tooLarge = true; chunks.length = 0; return; }
      if (!tooLarge) chunks.push(chunk);
    });
    req.on("end", () => tooLarge ? reject(new Error("O arquivo ultrapassa o limite permitido.")) : resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}
const imageTypes = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
module.exports = async (req, res) => {
  const customer = getCustomerSession(req);
  if (!customer) return send(res, 401, { error: "Entre na sua conta para continuar." });
  try {
    if (req.method === "GET") {
      const { rows } = await db().query(
        "SELECT id,order_number,service,description,status,cancellation_status,cancellation_requested_at,cancellation_reviewed_at,created_at,updated_at FROM orders WHERE customer_user_id=$1 ORDER BY created_at DESC LIMIT 100",
        [customer.id]
      );
      return send(res, 200, { orders: rows });
    }
    if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });

    if (req.query?.upload_photo === "1") {
      const contentType = String(req.headers["content-type"] || "").toLowerCase();
      const ext = imageTypes[contentType];
      if (!ext) return send(res, 400, { error: "Envie uma imagem JPG, PNG ou WEBP." });
      let fileName = String(req.headers["x-file-name"] || "foto-do-pedido");
      try { fileName = decodeURIComponent(fileName); } catch {}
      fileName = fileName.replace(/[\\/\\r\\n\\0]/g, "_").slice(0, 180) || "foto-do-pedido";
      const buffer = await readRaw(req, 4 * 1024 * 1024);
      if (!buffer.length) return send(res, 400, { error: "O arquivo está vazio." });
      const key = customer.id + "/" + randomUUID() + "." + ext;
      const url = signObject("PUT", key, contentType, 300);
      const uploaded = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body: buffer });
      if (!uploaded.ok) {
        console.error("Neon storage upload failed:", uploaded.status, await uploaded.text().catch(() => ""));
        return send(res, 502, { error: "Não foi possível armazenar a foto. Tente novamente." });
      }
      return send(res, 200, { key, name: fileName, content_type: contentType, size: buffer.length });
    }

    let body = req.body;
    if (!body || typeof body !== "object") {
      const raw = await readRaw(req, 64 * 1024);
      try { body = JSON.parse(raw.toString("utf8")); }
      catch { return send(res, 400, { error: "Dados do pedido inválidos." }); }
    }
    const b = body || {};
    const service = String(b.service || "").trim();
    const description = String(b.description || "").trim();
    const phone = String(b.phone || "").trim() || "Não informado";
    const key = String(b.attachment_key || "").trim();
    const name = String(b.attachment_name || "").trim().slice(0, 255);
    const contentType = String(b.attachment_content_type || "");
    const size = Number(b.attachment_size || 0);
    if (service.length < 2 || service.length > 120 || description.length < 2 || description.length > 2000)
      return send(res, 400, { error: "Informe o tipo de serviço e os detalhes do pedido." });
    if (key && (!key.startsWith(customer.id + "/") || !/^[^\\s]+\\.(jpg|png|webp)$/i.test(key) ||
        !["image/jpeg","image/png","image/webp"].includes(contentType) ||
        !Number.isInteger(size) || size < 1 || size > 4 * 1024 * 1024 || !name))
      return send(res, 400, { error: "O anexo enviado não é válido. Selecione a foto novamente." });
    const { rows } = await db().query(
      "INSERT INTO orders(customer_user_id,customer_name,contact_phone,customer_email,service,description,attachment_key,attachment_name,attachment_content_type,attachment_size) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING order_number",
      [customer.id, customer.name, phone, customer.email, service, description, key || null, key ? name : null, key ? contentType : null, key ? size : null]
    );
    return send(res, 201, { order_number: rows[0].order_number });
  } catch (error) {
    console.error("customer orders failed", error.message);
    return send(res, 500, { error: error.message || "Não foi possível processar seus pedidos agora." });
  }
};
