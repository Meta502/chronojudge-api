import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { customAlphabet } from "nanoid";
import { renameClass, runCode } from "./multiSubmitController";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

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

      if (!code.length) {
        reply.status(200).send({
          message: "You did not enter your code!",
        });
        return;
      }
      if (code.search("public class") === -1) {
        reply.status(200).send({
          message: "CLE: Your program does not have a public class.",
        });
        return;
      }

      const randomId = customAlphabet(
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        16
      )();

      const processedCode = renameClass(code, randomId);
      const filePath = path.resolve("temp");

      fs.writeFileSync(`${filePath}/${randomId}.java`, processedCode);

      try {
        execSync(`javac ${filePath}/${randomId}.java`);
      } catch (error) {
        reply.send({
          message: "CLE",
          output: error,
        });
        return;
      } finally {
        fs.unlinkSync(`${filePath}/${randomId}.java`);
      }

      const codeOutput = await runCode(filePath, randomId, input, 2000);

      switch (codeOutput.errorType) {
        case "compile-time":
          reply.status(200).send({
            message: "An error occurred during compilation",
            output: codeOutput,
          });
          return;
        case "run-time":
          reply.status(200).send({
            message: "RTE",
            output: codeOutput,
          });
          return;
      }
      if (removeTrailing(codeOutput.stdout) === removeTrailing(output)) {
        reply.status(200).send({ message: "AC", output: codeOutput });
      } else if (codeOutput.stdout === "" && codeOutput.stderr == "") {
        reply.status(200).send({ message: "TLE", output: codeOutput });
      } else {
        reply.status(200).send({ message: "WA", output: codeOutput });
      }
    }
  );
}
