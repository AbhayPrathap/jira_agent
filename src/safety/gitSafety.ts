import * as vscode from "vscode";
import { execSync } from "child_process";

function getWorkspaceRoot(): string | null {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return null;
  }
  return folders[0].uri.fsPath;
}

export function ensureGitSafe(options?: { allowDirty?: boolean }): boolean {
  const workspaceRoot = getWorkspaceRoot();

  if (!workspaceRoot) {
    vscode.window.showErrorMessage(
      "No workspace folder open. Please open a Git repository."
    );
    return false;
  }

  try {
    const status = execSync("git status --porcelain", {
      cwd: workspaceRoot,
      stdio: "pipe",
    })
      .toString()
      .trim();

    if (!options?.allowDirty && status.length > 0) {
      vscode.window.showErrorMessage(
        "Working tree is not clean. Commit or stash changes before proceeding."
      );
      return false;
    }

    const branch = execSync("git branch --show-current", {
      cwd: workspaceRoot,
      stdio: "pipe",
    })
      .toString()
      .trim();

    if (["main", "master", "develop"].includes(branch)) {
      vscode.window.showErrorMessage(
        `You are on protected branch "${branch}". Please switch branches.`
      );
      return false;
    }

    return true;
  } catch {
    vscode.window.showErrorMessage(
      "The opened workspace is not a Git repository."
    );
    return false;
  }
}
