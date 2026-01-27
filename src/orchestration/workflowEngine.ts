import * as vscode from "vscode";
import { buildTicketInterpreterPrompt } from "../ai/prompts/ticketInterpreter.prompt";
import { buildImplementationPrompt, MarkupContent } from "../ai/prompts/implementationPrompt.prompt";
import { scanRepoContext } from "../context/repoScanner";
import { createJiraClient } from "../jira/jiraClient";
import { JiraService } from "../jira/jiraService";
import { approveInterpretation } from "../ui/intentApproval";
import { waitForChatReply } from "../ui/chatReplyWaiter";
import { workflowStore } from "./workflowStore";
import { extractArrayByKey, extractJsonBlock } from "../utils/dataFormatters";

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
        workflowStore.setIntentApproval(approval);
        if (!approval) { return; }

        await vscode.env.clipboard.writeText(prompt);

        await vscode.commands.executeCommand("composer.newAgentChat");

        await new Promise((resolve) => setTimeout(resolve, 100));

        await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
      }
    );
    const intentApproval = workflowStore.getIntentApproval();
    if (!intentApproval) { return; }

    const previousClipboard = await vscode.env.clipboard.readText();
    await waitForChatReply(previousClipboard, {
      onClipboardDetected: (clipboardContent) => this.processReply(clipboardContent),
    });
  }

  async processReply(clipboardContent: string): Promise<void> {
    try {
      const replyData = this.parseQuestionsAndRisks(clipboardContent);
      let markUpContent: MarkupContent = {};
      if (replyData) {
        if (replyData.questions.length > 0) {
          const answers = await this.collectDecisions(replyData.questions);
          markUpContent.questions = answers;
        }
        if (replyData.risks.length > 0) {
          const answers = await this.collectDecisions(replyData.risks);
          markUpContent.risks = answers;
        }
        if (replyData.intent) {
          markUpContent.intent = replyData.intent;
        }
        if (replyData.impactedAreas.length > 0) {
          markUpContent.impactedAreas = replyData.impactedAreas;
        }
      }

      // Build and send implementation prompt if we have content
      if (Object.keys(markUpContent).length > 0) {
        const repoContext = workflowStore.getRepoContext();
        const ticketIntent = workflowStore.getTicketIntent();
        const implementationPrompt = buildImplementationPrompt(markUpContent, ticketIntent, repoContext);

        await vscode.env.clipboard.writeText(implementationPrompt);

        await vscode.commands.executeCommand("composer.newAgentChat");

        await new Promise((resolve) => setTimeout(resolve, 100));

        await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
      }


    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to copy chat reply: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private parseQuestionsAndRisks(content: string): { questions: string[], risks: string[], intent: string, impactedAreas: string[] } | null {
    const jsonBlock = extractJsonBlock(content);
    if (jsonBlock) {
      try {
        const parsed: { questions: string[], risks: string[], intent: string, impactedAreas: string[] } = JSON.parse(jsonBlock);
        return {
          ...parsed,
          questions: Array.isArray(parsed.questions) ? parsed.questions : [],
          risks: Array.isArray(parsed.risks) ? parsed.risks : []
        };
      } catch {
        return null
      }
    }

    return {
      questions: extractArrayByKey(content, 'questions') as string[],
      risks: extractArrayByKey(content, 'risks') as string[],
      intent: extractArrayByKey(content, 'intent') as string,
      impactedAreas: extractArrayByKey(content, 'impactedAreas') as string[]
    };
  }

  async collectDecisions(questions: string[]) {
    const answers: Record<string, string> = {};
    for (const question of questions) {
      answers[question] = await vscode.window.showInputBox({
        prompt: question,
      }) ?? '';
    }
    return answers;
  }

}
