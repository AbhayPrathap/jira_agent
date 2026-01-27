import axios, { AxiosInstance, isAxiosError } from "axios";
import * as vscode from "vscode";

export async function createJiraClient(
  context: vscode.ExtensionContext
): Promise<AxiosInstance> {
  const config = vscode.workspace.getConfiguration("jiraAI");

  let baseUrl = "https://carestack.atlassian.net";
  let email = config.get<string>("email");
  let token = await context.secrets.get("jiraApiToken");


  if (!email) {
    email = await vscode.window.showInputBox({
      prompt: "Enter your Jira email address",
      placeHolder: "your-email@example.com",
      ignoreFocusOut: true,
    });

    if (!email) {
      throw new Error("Jira email is required");
    }

    await config.update("email", email, vscode.ConfigurationTarget.Global);
  }

  if (!token) {
    token = await vscode.window.showInputBox({
      prompt: "Enter your Jira API token (you can generate one at: https://id.atlassian.com/manage-profile/security/api-tokens)",
      placeHolder: "Your Jira API token",
      password: true,
      ignoreFocusOut: true,
    });

    if (!token) {
      throw new Error("Jira API token is required");
    }

    // Store token in secrets storage
    await context.secrets.store("jiraApiToken", token);
  }

  const client = axios.create({
    baseURL: baseUrl,
    auth: {
      username: email,
      password: token,
    },
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isAxiosError(error)) {
        if (error.response?.status === 401) {
          vscode.window.showErrorMessage("Jira authentication failed. Please check your email and API token.");
        }
        if (error.response?.status === 403) {
          vscode.window.showErrorMessage("Jira access forbidden");
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}
