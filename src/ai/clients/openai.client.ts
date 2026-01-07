import OpenAI from "openai";
import * as vscode from "vscode";
import { AIClient } from "../aiClient";

export class OpenAIClient implements AIClient {
  private client: OpenAI;
  private model: string;

  constructor(context: vscode.ExtensionContext) {
    const apiKey = context.secrets.get("openaiApiKey");

    if (!apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    this.model =
      vscode.workspace.getConfiguration("jiraAI").get<string>("openaiModel") ??
      "gpt-5-nano";

    this.client = new OpenAI({
      apiKey: '',
    });
  }

  async interpret(prompt: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: "You must respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty AI response");
    }

    return content;
  }
}
