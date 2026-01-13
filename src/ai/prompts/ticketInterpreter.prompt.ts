import { RepoContext } from "../../context/repoContext.types";
import { TicketIntent } from "../../jira/jira.types";

export function buildTicketInterpreterPrompt(
  ticket: TicketIntent,
  repoContext: RepoContext
) {
  const promptArtifacts = {
    id: "ticket-interpreter",
    title: "Jira Ticket Interpretation",
    role: "Senior software engineer analyzing a Jira ticket",
    inputContext: `
<JIRA_TICKET>
${JSON.stringify(ticket, null, 2)}
</JIRA_TICKET>

<REPO_CONTEXT>
${JSON.stringify(repoContext, null, 2)}
</REPO_CONTEXT>
`.trim(),
    instructions: `
1. Identify the intent of the ticket
2. List impacted modules or areas
3. Identify risks or ambiguities
`.trim(),
    outputContract: `
{
  "intent": string,
  "impactedAreas": string[],
  "risks": string[],
  "questions": string[]
}
`.trim(),
    executionNotes:
      "Strictly return JSON only. No prose. No markdown.Do not write migration files"
  };

  function formatPrompt(p: typeof promptArtifacts): string {
    return `
  # ${p.title}
  
  ## ROLE
  ${p.role}
  
  ## INPUT
  ${p.inputContext}
  
  ## TASK
  ${p.instructions}
  
  ## OUTPUT FORMAT (STRICT)
  ${p.outputContract}
  
  ${p.executionNotes ? `## NOTES\n${p.executionNotes}` : ""}
  `.trim();
  }

  return formatPrompt(promptArtifacts);
}
