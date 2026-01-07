import { PromptBundle } from "../types/promptBundle.types";

export function buildFinalPrompt(bundle: PromptBundle): string {
  return `
You are an expert software engineer.

Follow these rules strictly:
- Implement ONLY what is described
- Do NOT add new features
- Do NOT modify files outside the listed scope
- Preserve existing patterns and conventions
- If something is unclear, ask before proceeding

--- Ticket Summary ---
${bundle.ticket.summary}

--- Goals ---
${bundle.interpretation.goals.join("\n")}

--- Non-Goals ---
${bundle.interpretation.nonGoals.join("\n")}

--- Constraints ---
${bundle.interpretation.constraints.join("\n")}

--- Approved Change Plan ---

Rationale:
${bundle.changePlan.rationale.join("\n")}

Risks:
${bundle.changePlan.risks.join("\n")}

Assumptions:
${bundle.changePlan.assumptions.join("\n")}

--- Repository Context ---
Frontend: ${bundle.repoContext.isFrontend}
Backend: ${bundle.repoContext.isBackend}
Frontend Framework: ${bundle.repoContext.frontendFramework ?? "N/A"}
Backend Framework: ${bundle.repoContext.backendFramework ?? "N/A"}
Entry Points: ${bundle.repoContext.entryPoints.join(", ")}

Output:
- Provide code changes only
- Explain reasoning briefly
- Do not include unrelated suggestions
`.trim();
}
