import * as vscode from "vscode";
import { buildTicketInterpreterPrompt } from "../ai/prompts/ticketInterpreter.prompt";
import { scanRepoContext } from "../context/repoScanner";
import { createJiraClient } from "../jira/jiraClient";
import { JiraService } from "../jira/jiraService";
import { approveInterpretation } from "../ui/intentApproval";
import { workflowStore } from "./workflowStore";

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
