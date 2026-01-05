import * as vscode from "vscode";
import { TicketInterpretation } from "../ai/types/ticketInterpretation.types";

export async function approveInterpretation(
  interpretation: TicketInterpretation
): Promise<boolean> {
  const preview = `
Goals:
- ${interpretation.goals.join("\n- ")}

Non-Goals:
- ${interpretation.nonGoals.join("\n- ")}

Constraints:
- ${interpretation.constraints.join("\n- ")}

Assumptions:
- ${interpretation.assumptions.join("\n- ")}
  `;

  const result = await vscode.window.showInformationMessage(
    "Approve AI-interpreted ticket intent?",
    { modal: true, detail: preview },
    "Approve",
    "Reject"
  );

  return result === "Approve";
}
