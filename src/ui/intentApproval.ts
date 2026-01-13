import * as vscode from "vscode";
import { TicketInterpretation } from "../ai/types/ticketInterpretation.types";

export async function approveInterpretation(
  interpretation: string
): Promise<boolean> {

  const result = await vscode.window.showInformationMessage(
    "Approve interpreted ticket intent?",
    { modal: true, detail: interpretation },
    "Approve",
    "Reject"
  );

  return result === "Approve";
}
