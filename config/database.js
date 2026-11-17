const { URL } = require("node:url");

function getDatabaseConfig() {
  const provider = String(process.env.DB_PROVIDER || "neon").toLowerCase();
  const supported = new Set(["neon", "supabase", "local", "postgres"]);
  if (!supported.has(provider)) {
    throw new Error("DB_PROVIDER deve ser neon, supabase, local ou postgres.");
  }

  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL não configurada.");

  let parsed;
  try { parsed = new URL(rawUrl); } catch {
    throw new Error("DATABASE_URL inválida. Informe uma connection string PostgreSQL.");
  }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL precisa usar o protocolo PostgreSQL.");
  }

  const defaultSsl = provider === "local" ? "disable" : "verify-full";
  const sslMode = String(process.env.DATABASE_SSL || defaultSsl).toLowerCase();
  if (!new Set(["disable", "require", "verify-full"]).has(sslMode)) {
    throw new Error("DATABASE_SSL deve ser disable, require ou verify-full.");
  }
  if (provider === "local" && sslMode !== "disable" && sslMode !== "require" && sslMode !== "verify-full") {
    throw new Error("Modo SSL inválido para PostgreSQL local.");
  }

  // The explicit setting wins over sslmode embedded in the URL.
  parsed.searchParams.set("sslmode", sslMode);
  const poolMax = Number.parseInt(process.env.DATABASE_POOL_MAX || "5", 10);
  if (!Number.isInteger(poolMax) || poolMax < 1 || poolMax > 30) {
    throw new Error("DATABASE_POOL_MAX deve ser um número entre 1 e 30.");
  }

  return {
    connectionString: parsed.toString(),
    ssl: sslMode === "disable" ? false : { rejectUnauthorized: sslMode === "verify-full" },
    max: poolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    application_name: "papagaio-verde"
  };
}

module.exports = { getDatabaseConfig };
