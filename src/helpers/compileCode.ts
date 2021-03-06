import { execSync } from "child_process";
import { FastifyReply } from "fastify";
import fs from "fs";

const compileCode = (
  filePath: string,
  randomId: string,
  reply: FastifyReply,
  multiSubmit?: boolean
) => {
  try {
    execSync(`javac ${filePath}/${randomId}.java`);
    return true;
  } catch (error: any) {
    const message = {
      message: "CLE",
      output: {
        stderr: error.toString(),
      },
    };
    reply.send(multiSubmit ? [message] : message);
    return false;
  } finally {
    fs.unlinkSync(`${filePath}/${randomId}.java`);
  }
};

export default compileCode;
