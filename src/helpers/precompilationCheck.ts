import { FastifyReply } from "fastify";

const precompileCheck = (
  code: string,
  reply: FastifyReply,
  multiSubmit: boolean
) => {
  if (!code.length) {
    const message = {
      message: "You did not enter a program.",
    };
    reply.status(200).send(multiSubmit ? [message] : message);
    return false;
  }
  if (code.search("public class") === -1) {
    const message = {
      message: "CLE: Your program does not have a public class.",
    };
    reply.status(200).send(multiSubmit ? [message] : message);
    return false;
  }
  return true;
};

export default precompileCheck;
