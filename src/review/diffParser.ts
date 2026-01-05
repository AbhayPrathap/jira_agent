export function extractChangedFiles(diffStat: string): string[] {
  return diffStat
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split("|")[0].trim());
}
