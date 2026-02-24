import { JiraRawIssue, TicketIntent } from "./jira.types";

export function mapJiraToIntent(raw: JiraRawIssue): TicketIntent {
  return {
    ticketKey: raw.key,
    summary: raw.fields.summary,
    description: extractDescription(raw.fields.description),

    goals: [],
    nonGoals: [],
    constraints: [],
  };
}

interface AdfNode {
  type?: string;
  text?: string;
  content?: AdfNode[];
}

function extractTextFromAdfNode(node: AdfNode): string {
  if (!node) return "";

  if (typeof node.text === "string") {
    return node.text;
  }

  const content = node.content;
  if (!Array.isArray(content)) return "";

  const parts = content.map((child) => extractTextFromAdfNode(child)).filter((s) => s.length > 0);
  return parts.join(" ");
}

function extractDescription(description: any): string | undefined {
  try {
    if (!description?.content || !Array.isArray(description.content)) {
      return undefined;
    }

    const textPerBlock = description.content.map((block: AdfNode) => extractTextFromAdfNode(block));
    const nonEmptyBlocks = textPerBlock.filter((text: string) => text.length > 0);
    const fullText = nonEmptyBlocks.join("\n");

    if (!fullText || fullText.length === 0) {
      return undefined;
    }
    return fullText;
  } catch (err) {
    console.error("extractDescription failed:", err);
    return undefined;
  }
}
