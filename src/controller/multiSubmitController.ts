import { execSync } from "child_process";
import { spawn } from "promisify-child-process";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import findRemoveSync from "find-remove";

// import { java } from "compile-run";
// import { removeTrailing } from "./submitController";
import fs from "fs";
import { customAlphabet } from "nanoid";
export interface SubmissionBody {
  code: string;
  input: string[];
  output: string[];
}
import path from "path";
import { removeTrailing } from "./submitController";

function renameClassUtil(
  code: string,
  newClassName: string,
  targetSubstring: string
) {
  let newCode = "";
  for (let i = 0; i < code.length; ++i) {
    if (code.substring(i, targetSubstring.length + i) === targetSubstring) {
      let beforeCode = code.slice(0, i);
      let tempCode = code.slice(i, code.length);
      let afterCode = tempCode.slice(tempCode.search("{"), tempCode.length);
      newCode = beforeCode + targetSubstring + newClassName + " " + afterCode;
      break;
    }
  }
  return newCode;
}

function renameClass(code: string, newClassName: string) {
  let newCode = renameClassUtil(code, newClassName, "\r\npublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "\npublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "\rpublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "public class ");
  return newCode;
}

const runCode = async (filePath: string, randomId: string, input: string) => {
  const child = spawn(`java`, ["-cp", `${filePath}`, `${randomId}`], {
    encoding: "utf-8",
    killSignal: "SIGKILL",
  });

  const timeout = setTimeout(() => {
    child.kill();
  }, 5000);

  child?.stdin?.write(input);
  child?.stdin?.end();
  child?.on("close", () => {
    clearTimeout(timeout);
  });

  return child.catch((e) => e);
};

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

      if (!code.length) {
        reply.status(200).send([
          {
            message: "You did not enter a program.",
          },
        ]);
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
        reply.send([
          {
            message: "CLE",
          },
        ]);
        return;
      } finally {
        fs.unlinkSync(`${filePath}/${randomId}.java`);
      }

      const outputs = input.map((item) => runCode(filePath, randomId, item));

      Promise.all(outputs)
        .then((outputs) => {
          const results = outputs.map((item, index: number) => {
            if (item?.stderr) {
              return {
                message: "RTE",
                output: item,
              };
            } else if (item?.code === 243) {
              return {
                message: "TLE",
                output: item,
              };
            } else if (
              removeTrailing(String(item?.stdout)) ===
              removeTrailing(output[index])
            ) {
              return {
                message: "AC",
                output: item,
              };
            } else {
              return {
                message: "WA",
                output: item,
              };
            }
          });
          reply.send(results);
        })
        .finally(() => {
          findRemoveSync("temp", { prefix: randomId });
        });
    }
  );
}
