import * as vscode from "vscode";

export async function exportPrompt(prompt: string): Promise<void> {
  await vscode.env.clipboard.writeText(prompt);

  vscode.window.showInformationMessage(
    "Final prompt copied to clipboard. Paste it into Cursor / Chat."
  );
}
