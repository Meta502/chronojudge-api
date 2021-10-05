// Code reused from AlghiJudge. Credits to: Firdaus Al-Ghifari (@darklordace)
export function renameClassUtil(
  code: string,
  newClassName: string,
  targetSubstring: string
) {
  let newCode = "";
  let oldClassName = "";
  for (let i = 0; i < code.length; ++i) {
    if (code.substring(i, targetSubstring.length + i) === targetSubstring) {
      let beforeCode = code.slice(0, i);

      let tempCode = code.slice(i, code.length);

      oldClassName = String(
        tempCode.substring(0, tempCode.search("{")).trim().split(" ").pop()
      );

      let afterCode = tempCode.slice(tempCode.search("{"), tempCode.length);
      for (let j = 0; j < beforeCode.length; j++) {
        if (beforeCode.substring(j, oldClassName.length + j) === oldClassName) {
          let beforeName = beforeCode.slice(0, j);
          let afterName = beforeCode.slice(
            oldClassName.length + j,
            beforeCode.length
          );
          beforeCode = beforeName + newClassName + afterName;
          continue;
        }
      }

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
