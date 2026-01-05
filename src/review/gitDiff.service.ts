import { execSync } from "child_process";
import * as vscode from "vscode";

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error("No workspace folder open");
  }
  return folders[0].uri.fsPath;
}

export function getGitDiff(): string {
  const cwd = getWorkspaceRoot();

  try {
    const diff = execSync("git diff --stat && git diff --stat --cached", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return diff.trim();
  } catch (error: any) {
    if (error?.status === 1) {
      return "";
    }
    throw new Error("Failed to read git diff");
  }
}
