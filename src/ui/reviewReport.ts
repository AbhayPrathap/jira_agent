import * as vscode from "vscode";
import { ReviewResult } from "../review/planValidator";

export async function showReviewReport(result: ReviewResult): Promise<boolean> {
  const message = `
Allowed Files:
- ${result.allowedFiles.join("\n- ") || "None"}

Unexpected Files:
- ${result.unexpectedFiles.join("\n- ") || "None"}
`;

  const choice = await vscode.window.showInformationMessage(
    "Review generated changes",
    { modal: true, detail: message },
    "Accept",
    "Rework"
  );

  return choice === "Accept";
}
