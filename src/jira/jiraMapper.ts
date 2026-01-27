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

interface DescriptionContent {
  content: {
    content: { type: string, text: string }[]
  }[]
}

function extractDescription(description: any): string | undefined {
  try {
    if (!description?.content) {
      return undefined;
    }

    const extractText = (content: DescriptionContent['content']): string => {
      return content
        .map((item) => {
          return item?.content.map((c) => c?.text ?? "").filter((text) => text.length > 0).join(" ") ?? "";
        })
        .filter((text) => text.length > 0)
        .join(" ");
    };
    const fullText = extractText(description.content);
    if (!fullText || fullText.length === 0) {
      return undefined;
    }
    return fullText;
  } catch {
    return undefined;
  }
}
