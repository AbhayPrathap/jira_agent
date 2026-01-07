import { RepoContext } from "../../context/repoContext.types";
import { TicketIntent } from "../../jira/jira.types";
import { TicketInterpretation } from "../types/ticketInterpretation.types";

export function buildChangePlannerPrompt(
  intent: TicketIntent,
  interpretation: TicketInterpretation,
  repo: RepoContext
): string {
  return `
You are an engineering planning assistant.

Task:
Propose WHAT should change to satisfy the ticket.

Rules:
- Do NOT write code
- Do NOT suggest implementation details
- Only list files and reasoning
- Be conservative and explicit

Ticket Summary:
${intent.summary}

Goals:
${interpretation.goals.join("\n")}

Constraints:
${interpretation.constraints.join("\n")}

Repository Context:
- Frontend: ${repo.isFrontend}
- Backend: ${repo.isBackend}
- Frontend Framework: ${repo.frontendFramework ?? "N/A"}
- Backend Framework: ${repo.backendFramework ?? "N/A"}
- Entry Points: ${repo.entryPoints.join(", ")}

Return JSON strictly in this shape:
{
  "rationale": string[],
  "risks": string[],
  "assumptions": string[]
}
`.trim();
}
