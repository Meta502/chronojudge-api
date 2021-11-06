import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
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

const timePattern = /.*(\betime: \b).*/;

export default async function multiSubmitController(fastify: FastifyInstance) {
  // GET /
  fastify.post(
    "/code/multi",
    // @ts-ignore
    async function (
      _request: FastifyRequest<{ Body: SubmissionBody }>,
      reply: FastifyReply
    ) {
      // @ts-ignore
      const { code, input, output, timeLimit, id } = _request.body;

      if (!precompileCheck(code, reply, true)) {
        return;
      }

      const { randomId, filePath } = processCode(code);

      if (!compileCode(filePath, randomId, reply, true)) {
        return;
      }

      const outputs = [];
      let flag = false;
      let index = 0;

      for (const inp of input) {
        const setFlag = () => (flag = true);
        const output: any = await runCode(
          filePath,
          randomId,
          inp,
          7500,
          setFlag
        );
        if (flag) {
          break;
        }
        fastify.io.emit("progress", {
          case: index,
          id,
        });
        index++;
        outputs.push(output);
      }

      if (flag) {
        return [
          {
            message: "Program killed, potential infinite loop (Run Time >10s)",
          },
        ];
      }

      const results = outputs.map((item, index: number) => {
        const strippedOutput = removeTrailing(output[index]);
        const defaultOutput = {
          ...item,
          stdout: removeTrailing(String(item?.stdout)),
          input: input[index],
          output: strippedOutput,
        };

        let errors = item?.stderr;

        const time = errors.match(timePattern)?.[0]?.split(" ")?.[1];
        errors = errors?.replace(timePattern, "")?.trim();

        if (errors !== "") {
          return {
            message: "RTE",
            output: defaultOutput,
            time,
          };
        } else if (removeTrailing(String(item?.stdout)) === strippedOutput) {
          if (Number(time) * 1000 > timeLimit) {
            return {
              message: "AC w/ TLE",
              output: defaultOutput,
              time,
            };
          }

          return {
            message: "AC",
            output: defaultOutput,
            time,
          };
        } else if (Number(time) * 1000 > timeLimit) {
          return {
            message: "WA w/ TLE",
            output: defaultOutput,
            time,
          };
        } else {
          return {
            message: "WA",
            output: defaultOutput,
            time,
          };
        }
      });
      reply.send(results);
      fs.rmSync(path.resolve(`temp/${randomId}`), { recursive: true });
    }
  );
}
