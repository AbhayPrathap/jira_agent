import { TicketInterpretation } from "../types/ticketInterpretation.types";

export class TicketInterpreterAgent {
  constructor(private ai: { interpret: (p: string) => Promise<string> }) {}

  async interpret(prompt: string): Promise<TicketInterpretation> {
    const raw = await this.ai.interpret(prompt);
    return JSON.parse(raw) as TicketInterpretation;
  }
}
