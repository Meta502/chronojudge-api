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
  timeLimit: number;
}
import path from "path";
import { removeTrailing } from "./submitController";

export function renameClassUtil(
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

export function renameClass(code: string, newClassName: string) {
  let newCode = renameClassUtil(code, newClassName, "\r\npublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "\npublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "\rpublic class ");
  if (newCode === "")
    newCode = renameClassUtil(code, newClassName, "public class ");

  return newCode;
}

export const runCode = async (
  filePath: string,
  randomId: string,
  input: string,
  timeLimit: number
) => {
  const child = spawn(`java`, ["-cp", `${filePath}`, `${randomId}`], {
    encoding: "utf-8",
    maxBuffer: 512000,
  });

  const timeout = setTimeout(() => {
    child.kill();
  }, timeLimit);

  child?.on("error", (err) => {
    console.error(err);
  });

  process.on("uncaughtException", () => {
    console.error("COMPILATION ERROR OCCURRED");
  });

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
      const { code, input, output, timeLimit } = _request.body;

      if (!code.length) {
        reply.status(200).send([
          {
            message: "You did not enter a program.",
          },
        ]);
        return;
      }
      if (code.search("public class") === -1) {
        reply.status(200).send([
          {
            message: "CLE: Your program does not have a public class.",
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
            output: error,
          },
        ]);
        return;
      } finally {
        fs.unlinkSync(`${filePath}/${randomId}.java`);
      }

      const outputs = [];

      for (const inp of input) {
        const output = await runCode(filePath, randomId, inp, timeLimit);
        outputs.push(output);
      }

      const results = outputs.map((item, index: number) => {
        const strippedOutput = removeTrailing(output[index]);
        if (item?.stderr) {
          return {
            message: "RTE",
            output: { ...item, stdout: removeTrailing(String(item?.stdout)) },
          };
        } else if (item?.code === 143) {
          return {
            message: "TLE",
            output: { ...item, stdout: removeTrailing(String(item?.stdout)) },
          };
        } else if (removeTrailing(String(item?.stdout)) === strippedOutput) {
          return {
            message: "AC",
            output: { ...item, stdout: removeTrailing(String(item?.stdout)) },
          };
        } else {
          return {
            message: "WA",
            output: {
              ...item,
              stdout: removeTrailing(String(item?.stdout)),
              output: strippedOutput,
              input: input[index],
            },
          };
        }
      });
      reply.send(results);
      findRemoveSync("temp", { prefix: randomId });
    }
  );
}
