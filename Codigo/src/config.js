// Lee la configuración desde variables de entorno (archivo .env).

export function cargarConfig(env = process.env) {
  const num = (valor, porDefecto) => (valor === undefined || valor === "" ? porDefecto : Number(valor));
  return {
    puerto: num(env.PORT, 3000),
    bd: {
      host: env.DB_HOST || "localhost",
      puerto: num(env.DB_PORT, 3306),
      usuario: env.DB_USER || "root",
      password: env.DB_PASSWORD ?? "",
      nombre: env.DB_NAME || "vendix",
    },
    jwt: {
      secreto: env.JWT_SECRET || "",
      expira: env.JWT_EXPIRA || "7d",
    },
    corsOrigenes: (env.CORS_ORIGENES || "http://localhost:5173")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    zonaHoraria: env.ZONA_HORARIA || "America/Santiago",
    llm: {
      apiKey: env.LLM_API_KEY || "",
      baseUrl: (env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
      modelo: env.LLM_MODELO || "gpt-4o-mini",
    },
  };
}

export function validarConfig(config) {
  if (config.jwt.secreto.length < 32) {
    throw new Error(
      "Falta JWT_SECRET en el archivo .env (debe tener al menos 32 caracteres). Mira .env.example."
    );
  }
}
