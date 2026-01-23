import * as vscode from "vscode";
import { buildTicketInterpreterPrompt } from "../ai/prompts/ticketInterpreter.prompt";
import { buildImplementationPrompt, MarkupContent } from "../ai/prompts/implementationPrompt.prompt";
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
    const previousClipboard = await vscode.env.clipboard.readText();
    const intervalId = setInterval(async () => {
      const action = await vscode.window.showInformationMessage(
        "Please manually select the last chat reply in the chat panel and then click 'I've Copied'",
        "I've Copied",
        "Cancel"
      );
      if (action === "I've Copied") {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const currentClipboard = await vscode.env.clipboard.readText();
        if (currentClipboard && currentClipboard.trim().length > 0 && currentClipboard !== previousClipboard) {
          clearInterval(intervalId);
          await this.processReply(currentClipboard);
        } else {
          vscode.window.showErrorMessage(
            "Failed to copy chat reply: No changes detected"
          );
          return;
        }
      } else {
        return;
      }
    }, 10000)
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


  private extractJsonBlock(content: string): string | null {
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  private extractArrayByKey(content: string, key: string): string[] | string {
    const regex = new RegExp(`"${key}"\\s*:\\s*\\[(.*?)\\]`, 's');
    const match = content.match(regex);

    if (!match || !match[1]) {
      return [];
    }

    return match[1]
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('"'))
      .map(line =>
        line
          .replace(/^"/, '')
          .replace(/",?$/, '')
          .trim()
      )
      .filter(Boolean);
  }

  private parseQuestionsAndRisks(content: string): { questions: string[], risks: string[], intent: string, impactedAreas: string[] } | null {
    const jsonBlock = this.extractJsonBlock(content);
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
      questions: this.extractArrayByKey(content, 'questions') as string[],
      risks: this.extractArrayByKey(content, 'risks') as string[],
      intent: this.extractArrayByKey(content, 'intent') as string,
      impactedAreas: this.extractArrayByKey(content, 'impactedAreas') as string[]
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

  async pick(title: string, options: string[]) {
    const result = await vscode.window.showQuickPick(options, {
      placeHolder: title,
    });

    if (!result) {
      throw new Error("User cancelled input");
    }

    return result;
  }

}
