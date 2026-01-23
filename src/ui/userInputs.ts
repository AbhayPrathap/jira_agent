import * as vscode from "vscode";


export async function pick(title: string, options: string[]) {
    const result = await vscode.window.showQuickPick(options, {
      placeHolder: title,
    });

    if (!result) {
      throw new Error("User cancelled input");
    }

    return result;
  }