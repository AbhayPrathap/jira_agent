import * as vscode from "vscode";
import { analyzeTicket } from "./analyzeTicket.command";
import { generatePlan } from "./generatePlan.command";
import { generatePrompt } from "./generatePrompt.command";
import { WorkflowEngine } from "../orchestration/workflowEngine";

export function registerCommands(context: vscode.ExtensionContext) {
  const workflowEngine = new WorkflowEngine(context);
  context.subscriptions.push(
    analyzeTicket(workflowEngine),
    generatePlan(workflowEngine),
    generatePrompt(workflowEngine)
  );
}
