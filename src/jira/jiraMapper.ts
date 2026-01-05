import { JiraRawIssue, TicketIntent } from "./jira.types";

export function mapJiraToIntent(raw: JiraRawIssue): TicketIntent {
  return {
    ticketKey: raw.key,
    summary: raw.fields.summary,
    description: extractDescription(raw.fields.description),
    acceptanceCriteria: raw.fields.customfield_acceptance,

    goals: [],
    nonGoals: [],
    constraints: [],
  };
}

function extractDescription(description: any): string | undefined {
  try {
    return description?.content?.[0]?.content?.[0]?.text;
  } catch {
    return undefined;
  }
}
