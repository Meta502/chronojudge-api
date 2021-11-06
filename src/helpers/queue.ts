import Queue from "bee-queue";
import runCode from "./runCode";

const runQueue = new Queue("", {
  redis: {
    host: "redis-backend",
  },
});

const runJob = (
  filePath: string,
  randomId: string,
  input: string,
  timeLimit: number,
  setFlag: () => void = () => undefined
) => {
  const job = runQueue.createJob({
    filePath,
    randomId,
    input,
    timeLimit,
    setFlag,
  });
  job.timeout(10000).save();

  return new Promise((resolve, reject) => {
    job.on("succeeded", (result: any) => {
      resolve(result);
    });
    job.on("failed", (err: any) => {
      reject(err);
    });
  });
};

runQueue.process(2, async (job: any) => {
  const { filePath, randomId, input, timeLimit, setFlag } = job.data;
  const result = runCode(filePath, randomId, input, timeLimit, setFlag);
  return result;
});

export default runJob;
