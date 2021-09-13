import { execSync } from "child_process";
import { FastifyReply } from "fastify";
import fs from "fs";

const compileCode = (
  filePath: string,
  randomId: string,
  reply: FastifyReply
) => {
  try {
    execSync(`javac ${filePath}/${randomId}.java`);
    return true;
  } catch (error: any) {
    reply.send([
      {
        message: "CLE",
        output: {
          stderr: error.toString(),
        },
      },
    ]);
    return false;
  } finally {
    fs.unlinkSync(`${filePath}/${randomId}.java`);
  }
};

export default compileCode;
