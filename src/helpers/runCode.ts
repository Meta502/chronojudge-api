import { spawn } from "promisify-child-process";

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
      maxBuffer: 1024000,
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

  child?.stdin?.write(input);
  child?.stdin?.end();

  child?.on("close", () => {
    clearTimeout(timeout);
  });

  return child.catch((e) => e);
};

export default runCode;
