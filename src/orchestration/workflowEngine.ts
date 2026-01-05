import { ChangePlannerAgent } from "../ai/agents/changePlanner.agent";
import { TicketInterpreterAgent } from "../ai/agents/ticketInterpreter.agent";
import { buildChangePlannerPrompt } from "../ai/prompts/changePlanner.prompt";
import { buildFinalPrompt } from "../ai/prompts/finalPrompt.builder";
import { buildTicketInterpreterPrompt } from "../ai/prompts/ticketInterpreter.prompt";
import { exportPrompt } from "../ai/services/promptExport.service";
import { PromptBundle } from "../ai/types/promptBundle.types";
import { scanRepoContext } from "../context/repoScanner";

import { createJiraClient } from "../jira/jiraClient";
import { JiraService } from "../jira/jiraService";
import { extractChangedFiles } from "../review/diffParser";
import { getGitDiff } from "../review/gitDiff.service";
import { validateAgainstPlan } from "../review/planValidator";
import { ensureGitSafe } from "../safety/gitSafety";
import { approveChangePlan } from "../ui/changePlanApproval";
import { approveInterpretation } from "../ui/intentApproval";
import { showReviewReport } from "../ui/reviewReport";
import { WorkflowStep, workflowStore } from "./workflowStore";
import * as vscode from "vscode";

class WorkflowEngine {
  async startTicketAnalysis(context: vscode.ExtensionContext): Promise<void> {
    /* ---------------- Phase 3: Repo Context ---------------- */
    const repoContext = scanRepoContext();
    workflowStore.setRepoContext(repoContext);

    /* ---------------- Phase 4: Jira Intent ---------------- */
    const ticketKey = await vscode.window.showInputBox({
      prompt: "Enter Jira ticket key (e.g. PROJ-123)",
    });

    if (!ticketKey) {
      return;
    }

    const client = await createJiraClient(context);
    const jiraService = new JiraService(client);

    const intent = await jiraService.getTicketIntent(ticketKey);

    // 🔴 REQUIRED: Persist ticket intent
    workflowStore.setTicketIntent(intent);

    /* ---------------- Phase 5: AI Interpretation ---------------- */
    const prompt = buildTicketInterpreterPrompt(intent, repoContext);

    const aiClient = {
      interpret: async () =>
        JSON.stringify({
          goals: ["Add phone number input"],
          nonGoals: ["No backend validation changes"],
          constraints: ["Must be backward compatible"],
          assumptions: ["Phone number is optional"],
        }),
    }; // Stub AI client

    const agent = new TicketInterpreterAgent(aiClient);
    const interpretation = await agent.interpret(prompt);

    const approved = await approveInterpretation(interpretation);
    if (!approved) {
      vscode.window.showErrorMessage("Ticket interpretation rejected");
      return;
    }

    // REQUIRED: Persist interpretation
    workflowStore.setTicketInterpretation(interpretation);

    /* ---------------- Advance Workflow ---------------- */
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

    const repoContext = workflowStore.getRepoContext();
    const ticketIntent = workflowStore.getTicketIntent();
    const interpretation = workflowStore.getTicketInterpretation();

    const prompt = buildChangePlannerPrompt(
      ticketIntent,
      interpretation,
      repoContext
    );

    const aiClient = {
      interpret: async () =>
        JSON.stringify({
          frontendFiles: [
            "src/pages/cs-portal/user/components/add-user-modal/index.tsx",
          ],
          backendFiles: [],
          rationale: ["Add phone number input field to user form"],
          risks: ["UI regression in form layout"],
          assumptions: ["No backend changes required"],
        }),
    };

    const agent = new ChangePlannerAgent(aiClient);
    const plan = await agent.plan(prompt);

    console.log("Prompt:", prompt);

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
        "Please generate and approve a change plan before exporting the prompt."
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

  async reviewChanges(): Promise<void> {
    if (!ensureGitSafe({ allowDirty: true })) {
      return;
    }
    if (workflowStore.getStep() !== WorkflowStep.PromptGenerated) {
      vscode.window.showErrorMessage(
        "Generate prompt and apply changes before review."
      );
      return;
    }

    const diff = getGitDiff();

    if (!diff) {
      vscode.window.showInformationMessage(
        "No changes detected. Nothing to review."
      );
      return;
    }
    const changedFiles = extractChangedFiles(diff);

    const plan = workflowStore.getChangePlan();
    const result = validateAgainstPlan(changedFiles, plan);

    const accepted = await showReviewReport(result);

    if (!accepted) {
      vscode.window.showWarningMessage(
        "Changes require rework. Please regenerate or adjust."
      );
      return;
    }

    vscode.window.showInformationMessage("Changes reviewed and accepted.");
  }
}

export const workflowEngine = new WorkflowEngine();
