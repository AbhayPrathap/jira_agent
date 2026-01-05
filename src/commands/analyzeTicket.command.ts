import * as vscode from "vscode";
import { workflowEngine } from "../orchestration/workflowEngine";
import { ensureGitSafe } from "../safety/gitSafety";

export function analyzeTicket(context: vscode.ExtensionContext) {
  return vscode.commands.registerCommand("jiraAI.analyzeTicket", async () => {
    if (!ensureGitSafe()) {
      return;
    }
    await workflowEngine.startTicketAnalysis(context);
  });
}
