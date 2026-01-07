import * as vscode from "vscode";
import { ensureGitSafe } from "../safety/gitSafety";
import { WorkflowEngine } from "../orchestration/workflowEngine";

export function generatePrompt(workflowEngine: WorkflowEngine) {
  return vscode.commands.registerCommand("jiraAI.generatePrompt", async () => {
    if (!ensureGitSafe()) {
      return;
    }

    await workflowEngine.generatePrompt();
  });
}
