import * as vscode from "vscode";
import { ensureGitSafe } from "../safety/gitSafety";
import { workflowEngine } from "../orchestration/workflowEngine";

export function generatePlan() {
  return vscode.commands.registerCommand("jiraAI.generatePlan", async () => {
    if (!ensureGitSafe()) {
      return;
    }

    await workflowEngine.generatePlan();
  });
}
