const isProduction = process.env.NODE_ENV === "production";

function required(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function parseOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((origin) => origin.replace(/\/+$/, ""));
}

export function loadServerConfig() {
  const jwtSecret = required("JWT_SECRET");
  if (isProduction && jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }

  const databaseUrl = required("DATABASE_URL");
  const clientOrigins = parseOrigins(process.env.CLIENT_URL || "http://localhost:5173");

  if (isProduction) {
    if (!clientOrigins.length) throw new Error("CLIENT_URL is required in production");

    for (const origin of clientOrigins) {
      let parsed;
      try {
        parsed = new URL(origin);
      } catch {
        throw new Error(`Invalid CLIENT_URL origin: ${origin}`);
      }
      if (parsed.protocol !== "https:") {
        throw new Error(`Production CLIENT_URL must use HTTPS: ${origin}`);
      }
    }
  }

  const port = Number(process.env.PORT) || 4000;
  if (!Number.isInteger(port) || port <= 0) throw new Error("PORT must be a positive integer");

  return {
    isProduction,
    port,
    jwtSecret,
    databaseUrl,
    clientOrigins,
    trustProxy: process.env.TRUST_PROXY === "true",
  };
}