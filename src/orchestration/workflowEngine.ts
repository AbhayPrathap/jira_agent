import * as vscode from "vscode";
import { ChangePlannerAgent } from "../ai/agents/changePlanner.agent";
import { TicketInterpreterAgent } from "../ai/agents/ticketInterpreter.agent";
import { OpenAIClient } from "../ai/clients/openai.client";
import { buildChangePlannerPrompt } from "../ai/prompts/changePlanner.prompt";
import { buildFinalPrompt } from "../ai/prompts/finalPrompt.builder";
import { buildTicketInterpreterPrompt } from "../ai/prompts/ticketInterpreter.prompt";
import { exportPrompt } from "../ai/services/promptExport.service";
import { PromptBundle } from "../ai/types/promptBundle.types";
import { scanRepoContext } from "../context/repoScanner";
import { createJiraClient } from "../jira/jiraClient";
import { JiraService } from "../jira/jiraService";
import { approveChangePlan } from "../ui/changePlanApproval";
import { approveInterpretation } from "../ui/intentApproval";
import { WorkflowStep, workflowStore } from "./workflowStore";

export class WorkflowEngine {
  constructor(private readonly context: vscode.ExtensionContext) { }

  async startTicketAnalysis(): Promise<void> {

    const repoContext = scanRepoContext();
    workflowStore.setRepoContext(repoContext);

    const ticketKey = await vscode.window.showInputBox({
      prompt: "Enter Jira ticket key (e.g. PROJ-123)",
    });
    if (!ticketKey) { return; }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Analyzing Jira ticket…",
      },
      async () => {
        const client = await createJiraClient(this.context);
        const jiraService = new JiraService(client);
        const intent = await jiraService.getTicketIntent(ticketKey);

        workflowStore.setTicketIntent(intent);

        const prompt = buildTicketInterpreterPrompt(intent, repoContext);

        const approval = await approveInterpretation(prompt);
        if (!approval) { return; }

        await vscode.env.clipboard.writeText(prompt);

        await vscode.commands.executeCommand("composer.newAgentChat");

        await new Promise((resolve) => setTimeout(resolve, 100));

        await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
      }
    );
  }
}
