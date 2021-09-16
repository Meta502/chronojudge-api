import app from "./app";

const FASTIFY_PORT =
  Number(process.env.FASTIFY_PORT) || Number(process.env.PORT) || 3006;

app.listen(FASTIFY_PORT, "0.0.0.0");

console.log(`🚀  Fastify server running on port ${FASTIFY_PORT}`);
