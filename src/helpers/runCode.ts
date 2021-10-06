import { spawn } from "promisify-child-process";
import stringToStream from "string-to-stream";

const runCode = async (
  filePath: string,
  randomId: string,
  input: string,
  timeLimit: number,
  setFlag: () => void = () => undefined
) => {
  const child = spawn(
    `(timeout 10s bash -c 'TIMEFORMAT="etime: %U"; time java`,
    ["-XX:ActiveProcessorCount=1", "-cp", `${filePath}`, `${randomId}')`],
    {
      encoding: "utf-8",
      maxBuffer: 32768000,
      shell: "/bin/bash",
    }
  );

  const timeout = setTimeout(() => {
    child.kill();
    setFlag();
  }, timeLimit);

  child?.on("error", (err) => {
    console.error(err);
  });

  child?.on("spawn", () => {
    // @ts-ignore
    stringToStream(input).pipe(child.stdin, { end: true });
  });

  child?.on("close", () => {
    clearTimeout(timeout);
  });

  return child.catch((e) => e);
};

export default runCode;
