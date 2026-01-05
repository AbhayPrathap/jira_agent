import * as vscode from "vscode";
import { ensureGitSafe } from "../safety/gitSafety";
import { workflowEngine } from "../orchestration/workflowEngine";

export function generatePrompt() {
  return vscode.commands.registerCommand("jiraAI.generatePrompt", async () => {
    if (!ensureGitSafe()) {
      return;
    }

    await workflowEngine.generatePrompt();
  });
}
