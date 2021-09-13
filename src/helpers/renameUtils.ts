// Code reused from AlghiJudge. Credits to: Firdaus Al-Ghifari (@darklordace)
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
