import * as vscode from "vscode";
import { ensureGitSafe } from "../safety/gitSafety";
import { WorkflowEngine } from "../orchestration/workflowEngine";

export function generatePlan(workflowEngine: WorkflowEngine) {
  return vscode.commands.registerCommand("jiraAI.generatePlan", async () => {
    if (!ensureGitSafe()) {
      return;
    }

    await workflowEngine.generatePlan();
  });
}
