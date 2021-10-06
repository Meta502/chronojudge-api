export function replaceAll(
  oldString: string,
  targetString: string,
  replaceString: string
) {
  let newString = oldString;
  for (let j = 0; j < newString.length; j++) {
    if (newString.substring(j, targetString.length + j) === targetString) {
      let beforeName = newString.slice(0, j);
      let afterName = newString.slice(
        targetString.length + j,
        newString.length
      );
      newString = beforeName + replaceString + afterName;
    }
  }
  return newString;
}

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
      let tempCode = code.slice(i, code.length);

      oldClassName = String(
        tempCode.substring(0, tempCode.search("{")).trim().split(" ").pop()
      );

      // Replace all instances of old classname with the newly generated classname.
      let beforeCode = replaceAll(code.slice(0, i), oldClassName, newClassName);
      let afterCode = replaceAll(
        tempCode.slice(tempCode.search("{"), tempCode.length),
        oldClassName,
        newClassName
      );

      // Rebuild code string.
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
