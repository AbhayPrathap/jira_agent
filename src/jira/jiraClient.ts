import axios, { AxiosInstance, isAxiosError } from "axios";
import * as vscode from "vscode";

export async function createJiraClient(
  context: vscode.ExtensionContext
): Promise<AxiosInstance> {
  const config = vscode.workspace.getConfiguration("jiraAI");

  const baseUrl = config.get<string>("baseUrl");
  const email = config.get<string>("email");
  const token = await context.secrets.get("jiraApiToken");

  if (!baseUrl || !email || !token) {
    throw new Error("Jira configuration or token is missing");
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
          vscode.window.showErrorMessage("Jira authentication failed");
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
