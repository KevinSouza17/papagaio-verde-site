const crypto = require("node:crypto");

const BUCKET = "order-attachments";
const REGION = process.env.AWS_REGION || "us-east-1";

function hmac(key, value, encoding) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest(encoding);
}
function awsEncode(value) {
  return encodeURIComponent(value).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}
function signObject(method, key, contentType, expires = 300, downloadName) {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3;
  if (!accessKey || !secretKey || !endpoint) throw new Error("Armazenamento de anexos não configurado.");
  const base = new URL(endpoint);
  const objectPath = key.split("/").map(awsEncode).join("/");
  const canonicalUri = (base.pathname.replace(/\/$/, "") + "/" + BUCKET + "/" + objectPath).replace(/\/+/g, "/");
  const host = base.host;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const date = amzDate.slice(0, 8);
  const scope = date + "/" + REGION + "/s3/aws4_request";
  const signedHeaders = method === "PUT" ? "content-type;host" : "host";
  const params = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": accessKey + "/" + scope,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expires),
    "X-Amz-SignedHeaders": signedHeaders
  };
  if (downloadName) params["response-content-disposition"] = "attachment; filename*=UTF-8''" + awsEncode(downloadName);
  const canonicalQuery = Object.keys(params).sort().map(k => awsEncode(k) + "=" + awsEncode(params[k])).join("&");
  const canonicalHeaders = method === "PUT" ? "content-type:" + contentType + "\nhost:" + host + "\n" : "host:" + host + "\n";
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");
  const kDate = hmac("AWS4" + secretKey, date);
  const kRegion = crypto.createHmac("sha256", kDate).update(REGION).digest();
  const kService = crypto.createHmac("sha256", kRegion).update("s3").digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");
  return base.origin + canonicalUri + "?" + canonicalQuery + "&X-Amz-Signature=" + signature;
}
module.exports = { signObject, BUCKET };
