const { randomUUID } = require("node:crypto");
const { send, getCustomerSession } = require("../_lib");
const { signObject } = require("../_storage");

const types = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405, { error: "Método não permitido." });
  const customer = getCustomerSession(req);
  if (!customer) return send(res, 401, { error: "Entre na sua conta para anexar uma foto." });
  const body = req.body || {};
  const contentType = String(body.content_type || "");
  const size = Number(body.size || 0);
  const ext = types[contentType];
  if (!ext) return send(res, 400, { error: "Envie uma imagem JPG, PNG ou WEBP." });
  if (!Number.isInteger(size) || size < 1 || size > 8 * 1024 * 1024) return send(res, 400, { error: "A foto deve ter até 8 MB." });
  try {
    const key = customer.id + "/" + randomUUID() + "." + ext;
    const uploadUrl = signObject("PUT", key, contentType, 300);
    return send(res, 200, { key, upload_url: uploadUrl, headers: { "Content-Type": contentType } });
  } catch (error) {
    console.error("order attachment upload URL failed:", error.message);
    return send(res, 503, { error: "O envio de fotos está temporariamente indisponível." });
  }
};
