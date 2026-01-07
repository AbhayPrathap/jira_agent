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
  constructor(private readonly context: vscode.ExtensionContext) {}

  async startTicketAnalysis(): Promise<void> {
    
    const repoContext = scanRepoContext();
    workflowStore.setRepoContext(repoContext);

    const ticketKey = await vscode.window.showInputBox({
      prompt: "Enter Jira ticket key (e.g. PROJ-123)",
    });
    if (!ticketKey) {return;}

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
        const aiClient = new OpenAIClient(this.context);
        const agent = new TicketInterpreterAgent(aiClient);

        const interpretation = await agent.interpret(prompt);
        workflowStore.setTicketInterpretation(interpretation);
      }
    );

    const approved = await approveInterpretation(
      workflowStore.getTicketInterpretation()
    );
    if (!approved) {
      vscode.window.showErrorMessage("Ticket interpretation rejected");
      return;
    }

    workflowStore.setStep(WorkflowStep.TicketAnalyzed);

    const proceed = await vscode.window.showInformationMessage(
      "Ticket analyzed successfully. Generate change plan?",
      "Continue",
      "Stop"
    );

    if (proceed === "Continue") {
      await this.generatePlan();
    }
  }

  async generatePlan(): Promise<void> {
    if (workflowStore.getStep() !== WorkflowStep.TicketAnalyzed) {
      vscode.window.showErrorMessage("Analyze ticket first");
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating change plan…",
      },
      async () => {
        const prompt = buildChangePlannerPrompt(
          workflowStore.getTicketIntent(),
          workflowStore.getTicketInterpretation(),
          workflowStore.getRepoContext()
        );

        const aiClient = new OpenAIClient(this.context);
        const agent = new ChangePlannerAgent(aiClient);
        const plan = await agent.plan(prompt);

        workflowStore.setChangePlan(plan);
      }
    );

    const approved = await approveChangePlan(workflowStore.getChangePlan());
    if (!approved) {
      vscode.window.showErrorMessage("Change plan rejected");
      return;
    }

    workflowStore.setStep(WorkflowStep.PlanGenerated);

    const proceed = await vscode.window.showInformationMessage(
      "Change plan approved. Generate final AI prompt?",
      "Continue",
      "Stop"
    );

    if (proceed === "Continue") {
      await this.generatePrompt();
    }
  }

  async generatePrompt(): Promise<void> {
    if (workflowStore.getStep() !== WorkflowStep.PlanGenerated) {
      vscode.window.showErrorMessage("Generate plan first");
      return;
    }

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Preparing final AI prompt…",
      },
      async () => {
        const bundle: PromptBundle = {
          ticket: workflowStore.getTicketIntent(),
          interpretation: workflowStore.getTicketInterpretation(),
          changePlan: workflowStore.getChangePlan(),
          repoContext: workflowStore.getRepoContext(),
          instructions: "",
          constraints: workflowStore.getTicketInterpretation().constraints,
        };

        const finalPrompt = buildFinalPrompt(bundle);
        await exportPrompt(finalPrompt);
      }
    );

    workflowStore.setStep(WorkflowStep.PromptGenerated);
  }
}
