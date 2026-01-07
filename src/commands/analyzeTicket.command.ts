import { WorkflowEngine } from "../orchestration/workflowEngine";
import { ensureGitSafe } from "../safety/gitSafety";
import * as vscode from "vscode";

export function analyzeTicket(workflowEngine: WorkflowEngine) {
  return vscode.commands.registerCommand("jiraAI.analyzeTicket", async () => {
    if (!ensureGitSafe()) {
      return;
    }
    await workflowEngine.startTicketAnalysis();
  });
}
