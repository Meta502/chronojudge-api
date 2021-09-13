export default function removeTrailing(text: string) {
  let result = text
    .split("\r\n")
    .map((x) => x.trim())
    .join("\n");
  result = result
    .split("\n")
    .map((x) => x.trim())
    .join("\n");

  result = result
    .split("\r")
    .map((x) => x.trim())
    .join("\n");

  return result;
}
