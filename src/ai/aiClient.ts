export interface AIClient {
  interpret(prompt: string): Promise<string>;
}
