export function extractJson(raw: string): string {
  if (!raw) {
    throw new Error("Empty AI response");
  }

  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
