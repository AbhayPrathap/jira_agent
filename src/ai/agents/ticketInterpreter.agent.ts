import { TicketInterpretation } from "../types/ticketInterpretation.types";
import { extractJson } from "../utils/jsonSanitizer";

export class TicketInterpreterAgent {
  constructor(private ai: { interpret: (p: string) => Promise<string> }) {}

  async interpret(prompt: string): Promise<TicketInterpretation> {
    const raw = await this.ai.interpret(prompt);
    const cleaned = extractJson(raw);

    try {
      return JSON.parse(cleaned) as TicketInterpretation;
    } catch (error) {
      throw new Error("AI returned invalid JSON");
    }
  }
}
