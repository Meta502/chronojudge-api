import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";

import runCode from "../helpers/runCode";
import removeTrailing from "../helpers/removeTrailing";
import processCode from "../helpers/processCode";
import precompileCheck from "../helpers/precompilationCheck";
import compileCode from "../helpers/compileCode";

export interface SubmissionBody {
  code: string;
  input: string;
  output: string;
}

const timePattern = /.*(\betime: \b).*/;

export default async function submitController(fastify: FastifyInstance) {
  // GET /
  fastify.post(
    "/code/submit",
    async function (
      _request: FastifyRequest<{ Body: SubmissionBody }>,
      reply: FastifyReply
    ) {
      // @ts-ignore
      const { code, input, output } = _request.body;

      if (!precompileCheck(code, reply, false)) {
        return;
      }

      const { randomId, filePath } = processCode(code);

      if (!compileCode(filePath, randomId, reply)) {
        return;
      }

      const codeOutput = await runCode(filePath, randomId, input, 2000);
      let errors = codeOutput?.stderr;

      const time = errors.match(timePattern)?.[0]?.split(" ")?.[1];

      if (removeTrailing(codeOutput.stdout) === removeTrailing(output)) {
        reply.status(200).send({ message: "AC", output: codeOutput, time });
      } else if (codeOutput.stdout === "" && codeOutput.stderr == "") {
        reply.status(200).send({ message: "TLE", output: codeOutput, time });
      } else {
        reply.status(200).send({ message: "WA", output: codeOutput, time });
      }
      fs.rmSync(path.resolve(`temp/${randomId}`), { recursive: true });
    }
  );
}
