import * as vscode from "vscode";
import { workflowEngine } from "../orchestration/workflowEngine";

export function reviewChanges() {
  return vscode.commands.registerCommand("jiraAI.reviewChanges", async () => {
    await workflowEngine.reviewChanges();
  });
}
