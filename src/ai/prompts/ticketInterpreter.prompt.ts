import { RepoContext } from "../../context/repoContext.types";
import { TicketIntent } from "../../jira/jira.types";

export function buildTicketInterpreterPrompt(
  ticket: TicketIntent,
  repo: RepoContext
): string {
  return `
You are an engineering assistant.

Task:
Interpret the Jira ticket into structured intent.

Rules:
- Do NOT propose code
- Do NOT mention files unless necessary
- Be explicit and conservative
- Avoid assumptions unless unavoidable

Jira Summary:
${ticket.summary}

Jira Description:
${ticket.description ?? "N/A"}


Repository Context:
- Frontend: ${repo.isFrontend}
- Backend: ${repo.isBackend}
- Frontend Framework: ${repo.frontendFramework ?? "N/A"}
- Backend Framework: ${repo.backendFramework ?? "N/A"}

Return JSON strictly in this shape:
{
  "goals": string[],
  "nonGoals": string[],
  "constraints": string[],
  "assumptions": string[]
}
`.trim();
}
