import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import findRemoveSync from "find-remove";
import compileCode from "../helpers/compileCode";
import precompileCheck from "../helpers/precompilationCheck";

import processCode from "../helpers/processCode";
import removeTrailing from "../helpers/removeTrailing";
import runCode from "../helpers/runCode";

export interface SubmissionBody {
  code: string;
  input: string[];
  output: string[];
  timeLimit: number;
}

export default async function multiSubmitController(fastify: FastifyInstance) {
  // GET /
  fastify.post(
    "/code/multi",
    async function (
      _request: FastifyRequest<{ Body: SubmissionBody }>,
      reply: FastifyReply
    ) {
      // @ts-ignore
      const { code, input, output, timeLimit } = _request.body;

      if (!precompileCheck(code, reply, true)) {
        return;
      }

      const { randomId, filePath } = processCode(code);

      if (!compileCode(filePath, randomId, reply, true)) {
        return;
      }

      const outputs = [];

      for (const inp of input) {
        const output = await runCode(filePath, randomId, inp, 25000);
        outputs.push(output);
      }

      const results = outputs.map((item, index: number) => {
        const strippedOutput = removeTrailing(output[index]);
        const defaultOutput = {
          ...item,
          stdout: removeTrailing(String(item?.stdout)),
          input: input[index],
          output: strippedOutput,
        };

        if (item?.stderr) {
          return {
            message: "RTE",
            output: defaultOutput,
          };
        } else if (item?.code === 143) {
          return {
            message: "TLE (website might be overloaded)",
            output: defaultOutput,
          };
        } else if (removeTrailing(String(item?.stdout)) === strippedOutput) {
          return {
            message: "AC",
            output: defaultOutput,
          };
        } else {
          return {
            message: "WA",
            output: defaultOutput,
          };
        }
      });
      reply.send(results);
      findRemoveSync("temp", { prefix: randomId });
    }
  );
}
