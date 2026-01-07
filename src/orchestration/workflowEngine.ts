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

    if (!ticketKey) {
      return;
    }

    const client = await createJiraClient(this.context);
    const jiraService = new JiraService(client);
    const intent = await jiraService.getTicketIntent(ticketKey);

    workflowStore.setTicketIntent(intent);

    const prompt = buildTicketInterpreterPrompt(intent, repoContext);
    const aiClient = new OpenAIClient(this.context);
    const agent = new TicketInterpreterAgent(aiClient);

    const interpretation = await agent.interpret(prompt);
    const approved = await approveInterpretation(interpretation);

    if (!approved) {
      vscode.window.showErrorMessage("Ticket interpretation rejected");
      return;
    }

    workflowStore.setTicketInterpretation(interpretation);
    workflowStore.setStep(WorkflowStep.TicketAnalyzed);

    vscode.window.showInformationMessage(
      `Ticket ${intent.ticketKey} analyzed successfully`
    );
  }

  async generatePlan(): Promise<void> {
    if (workflowStore.getStep() !== WorkflowStep.TicketAnalyzed) {
      vscode.window.showErrorMessage(
        "Analyze Jira ticket before generating plan"
      );
      return;
    }

    const prompt = buildChangePlannerPrompt(
      workflowStore.getTicketIntent(),
      workflowStore.getTicketInterpretation(),
      workflowStore.getRepoContext()
    );

    const aiClient = new OpenAIClient(this.context);
    const agent = new ChangePlannerAgent(aiClient);
    const plan = await agent.plan(prompt);

    const approved = await approveChangePlan(plan);
    if (!approved) {
      vscode.window.showErrorMessage("Change plan rejected");
      return;
    }

    workflowStore.setChangePlan(plan);
    workflowStore.setStep(WorkflowStep.PlanGenerated);
  }

  async generatePrompt(): Promise<void> {
    if (workflowStore.getStep() !== WorkflowStep.PlanGenerated) {
      vscode.window.showErrorMessage(
        "Generate and approve a change plan first."
      );
      return;
    }

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

    workflowStore.setStep(WorkflowStep.PromptGenerated);
  }
}
