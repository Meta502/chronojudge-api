import fs from "fs";
import { customAlphabet } from "nanoid";
import path from "path";

import { renameClass } from "./renameUtils";

const processCode = (code: string) => {
  const randomId = customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    16
  )();

  const processedCode = renameClass(code, randomId);

  const filePath = path.resolve("temp");

  fs.writeFileSync(`${filePath}/${randomId}.java`, processedCode);

  return { filePath, randomId };
};

export default processCode;
