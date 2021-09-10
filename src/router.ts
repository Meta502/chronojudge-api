import { FastifyInstance } from "fastify";
import indexController from "./controller/indexController";
import submitController from "./controller/submitController";

export default async function router(fastify: FastifyInstance) {
  fastify.register(indexController, { prefix: "/" });
  fastify.register(submitController, { prefix: "/" });
}
