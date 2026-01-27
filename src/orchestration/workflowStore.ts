import { RepoContext } from "../context/repoContext.types";
import { TicketIntent } from "../jira/jira.types";
import { TicketInterpretation } from "../ai/types/ticketInterpretation.types";

export enum WorkflowStep {
  Idle = "IDLE",
  TicketAnalyzed = "TICKET_ANALYZED",
  PlanGenerated = "PLAN_GENERATED",
  PromptGenerated = "PROMPT_GENERATED",
}

class WorkflowStore {

  private repoContext?: RepoContext;
  private ticketIntent?: TicketIntent;
  private ticketInterpretation?: TicketInterpretation;
  private intentApproval?: boolean;

  setIntentApproval(approval: boolean): void {
    this.intentApproval = approval;
  }

  getIntentApproval(): boolean {
    return this.intentApproval ?? false;
  }

  setRepoContext(context: RepoContext): void {
    this.repoContext = context;
  }

  getRepoContext(): RepoContext {
    if (!this.repoContext) {
      throw new Error("Repo context not initialized");
    }
    return this.repoContext;
  }

  setTicketIntent(intent: TicketIntent): void {
    this.ticketIntent = intent;
  }

  getTicketIntent(): TicketIntent {
    if (!this.ticketIntent) {
      throw new Error("Ticket intent not initialized");
    }
    return this.ticketIntent;
  }

  setTicketInterpretation(interpretation: TicketInterpretation): void {
    this.ticketInterpretation = interpretation;
  }

  getTicketInterpretation(): TicketInterpretation {
    if (!this.ticketInterpretation) {
      throw new Error("Ticket interpretation not initialized");
    }
    return this.ticketInterpretation;
  }
}

export const workflowStore = new WorkflowStore();
