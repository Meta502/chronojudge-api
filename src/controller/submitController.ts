import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { java } from "compile-run";

export interface SubmissionBody {
  code: string;
  input: string;
  output: string;
}

export function removeTrailing(text: string) {
  let result = text
    .split("\r\n")
    .map((x) => x.trim())
    .join("\n");
  result = result
    .split("\n")
    .map((x) => x.trim())
    .join("\n");

  result = result
    .split("\r")
    .map((x) => x.trim())
    .join("\n");

  return result;
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
      const startTime = Date.now();

      const runCode = await java
        .runSource(code, { compileTimeout: 10000, stdin: input, timeout: 2000 })
        .then((result) => {
          const delta = Date.now() - startTime;
          return { ...result, time: delta };
        });

      switch (runCode.errorType) {
        case "compile-time":
          reply.status(200).send({
            message: "An error occurred during compilation",
            output: runCode,
          });
          return;
        case "run-time":
          reply.status(200).send({
            message: "RTE",
            output: runCode,
          });
          return;
      }
      if (removeTrailing(runCode.stdout) === removeTrailing(output)) {
        reply.status(200).send({ message: "AC", output: runCode });
      } else if (runCode.stdout === "" && runCode.stderr == "") {
        reply.status(200).send({ message: "TLE", output: runCode });
      } else {
        reply.status(200).send({ message: "WA", output: runCode });
      }
    }
  );
}
