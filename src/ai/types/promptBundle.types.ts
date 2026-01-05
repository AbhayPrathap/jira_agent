import { RepoContext } from "../../context/repoContext.types";
import { TicketIntent } from "../../jira/jira.types";
import { ChangePlan } from "./changePlan.types";
import { TicketInterpretation } from "./ticketInterpretation.types";

export interface PromptBundle {
  instructions: string;
  ticket: TicketIntent;
  interpretation: TicketInterpretation;
  changePlan: ChangePlan;
  repoContext: RepoContext;
  constraints: string[];
}
