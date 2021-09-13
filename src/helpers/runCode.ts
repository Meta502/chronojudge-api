import { spawn } from "promisify-child-process";

const runCode = async (
  filePath: string,
  randomId: string,
  input: string,
  timeLimit: number
) => {
  const child = spawn(
    `java`,
    ["-XX:ActiveProcessorCount=1", "-cp", `${filePath}`, `${randomId}`],
    {
      encoding: "utf-8",
      maxBuffer: 512000,
    }
  );

  const timeout = setTimeout(() => {
    child.kill();
  }, timeLimit);

  child?.on("error", (err) => {
    console.error(err);
  });

  child?.stdin?.write(input);
  child?.stdin?.end();

  child?.on("close", () => {
    clearTimeout(timeout);
  });

  return child.catch((e) => e);
};

export default runCode;
