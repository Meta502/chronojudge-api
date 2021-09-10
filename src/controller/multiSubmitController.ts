import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { java } from "compile-run";
import { removeTrailing } from "./submitController";

export interface SubmissionBody {
  code: string;
  input: string[];
  output: string[];
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
      const { code, input, output } = _request.body;

      const processes = input.map((item: any, index: number) => {
        return java
          .runSource(code, {
            compileTimeout: 10000,
            stdin: item,
            timeout: 2000,
          })
          .then((result) => {
            switch (result.errorType) {
              case "compile-time":
                return {
                  message: "An error occurred during compilation",
                  output: result,
                };
              case "run-time":
                return {
                  message: "RTE",
                  output: result,
                };
            }
            if (
              removeTrailing(result.stdout) === removeTrailing(output[index])
            ) {
              return { message: "AC", output: result };
            } else {
              return { message: "WA", output: result };
            }
          });
      });

      Promise.all(processes).then((item) => {
        reply.status(200).send(item);
      });
    }
  );
}
