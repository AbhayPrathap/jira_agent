import * as vscode from "vscode";

export async function approveInterpretation(
  interpretation: string
): Promise<boolean> {

  const result = await vscode.window.showInformationMessage(
    "Approve interpreted ticket intent?",
    { modal: true, detail: interpretation },
    "Approve",
    "Reject"
  );

  return result === "Approve";
}
