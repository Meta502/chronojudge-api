import { FastifyReply } from "fastify";

const precompileCheck = (code: string, reply: FastifyReply) => {
  if (!code.length) {
    reply.status(200).send([
      {
        message: "You did not enter a program.",
      },
    ]);
    return false;
  }
  if (code.search("public class") === -1) {
    reply.status(200).send([
      {
        message: "CLE: Your program does not have a public class.",
      },
    ]);
    return false;
  }
  return true;
};

export default precompileCheck;
