import * as vscode from "vscode";
import { ChangePlan } from "../ai/types/changePlan.types";

export async function approveChangePlan(plan: ChangePlan): Promise<boolean> {
  const preview = `
Frontend Files:
- ${plan.frontendFiles.join("\n- ")}

Backend Files:
- ${plan.backendFiles.join("\n- ")}

Rationale:
- ${plan.rationale.join("\n- ")}

Risks:
- ${plan.risks.join("\n- ")}

Assumptions:
- ${plan.assumptions.join("\n- ")}
`;

  const result = await vscode.window.showInformationMessage(
    "Approve AI-generated change plan?",
    { modal: true, detail: preview },
    "Approve",
    "Reject"
  );

  return result === "Approve";
}
