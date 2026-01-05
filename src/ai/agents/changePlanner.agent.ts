import { ChangePlan } from "../types/changePlan.types";

export class ChangePlannerAgent {
  constructor(private ai: { interpret: (prompt: string) => Promise<string> }) {}

  async plan(prompt: string): Promise<ChangePlan> {
    const raw = await this.ai.interpret(prompt);
    return JSON.parse(raw) as ChangePlan;
  }
}
