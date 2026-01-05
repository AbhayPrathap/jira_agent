import * as vscode from "vscode";
import { analyzeTicket } from "./analyzeTicket.command";
import { generatePlan } from "./generatePlan.command";
import { generatePrompt } from "./generatePrompt.command";
import { reviewChanges } from "./reviewChanges.command";

export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    analyzeTicket(context),
    generatePlan(),
    generatePrompt(),
    reviewChanges()
  );
}
