import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import findRemoveSync from "find-remove";

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

      if (!precompileCheck(code, reply)) {
        return;
      }

      const { randomId, filePath } = processCode(code);

      if (!compileCode(filePath, randomId, reply)) {
        return;
      }

      const codeOutput = await runCode(filePath, randomId, input, 2000);

      if (removeTrailing(codeOutput.stdout) === removeTrailing(output)) {
        reply.status(200).send({ message: "AC", output: codeOutput });
      } else if (codeOutput.stdout === "" && codeOutput.stderr == "") {
        reply.status(200).send({ message: "TLE", output: codeOutput });
      } else {
        reply.status(200).send({ message: "WA", output: codeOutput });
      }
      findRemoveSync("temp", { prefix: randomId });
    }
  );
}
