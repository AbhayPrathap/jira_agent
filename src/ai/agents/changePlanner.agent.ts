import { ChangePlan } from "../types/changePlan.types";
import { extractJson } from "../utils/jsonSanitizer";

export class ChangePlannerAgent {
  constructor(private ai: { interpret: (prompt: string) => Promise<string> }) {}

  async plan(prompt: string): Promise<ChangePlan> {
    const raw = await this.ai.interpret(prompt);
    const cleaned = extractJson(raw);

    try {
      return JSON.parse(cleaned) as ChangePlan;
    } catch (error) {
      throw new Error("AI returned invalid JSON");
    }
  }
}
