import * as vscode from "vscode";

export async function approveInterpretation(
  interpretation: string
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let resolved = false;
    
    const resolveOnce = (value: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(value);
      }
    };

    const panel = vscode.window.createWebviewPanel(
      "intentApproval",
      "Approve Interpreted Ticket Intent",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: false,
      }
    );

    // Escape HTML to prevent XSS
    const escapeHtml = (text: string): string => {
      return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    // Convert newlines to <br> and preserve formatting
    const formatText = (text: string): string => {
      return escapeHtml(text).replace(/\n/g, "<br>");
    };

    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Approve Interpretation</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 0;
            margin: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
        }
        .header {
            padding: 15px 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            flex-shrink: 0;
        }
        .header h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        .container {
            display: flex;
            flex-direction: column;
            flex: 1;
            min-height: 0;
            padding: 20px;
        }
        .content {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            margin-bottom: 20px;
            white-space: pre-wrap;
            word-wrap: break-word;
            line-height: 1.5;
        }
        .content::-webkit-scrollbar {
            width: 10px;
        }
        .content::-webkit-scrollbar-track {
            background: var(--vscode-scrollbarSlider-background);
        }
        .content::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-activeBackground);
            border-radius: 5px;
        }
        .content::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
        .buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            flex-shrink: 0;
            padding-top: 10px;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            min-width: 100px;
        }
        .approve-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .approve-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .reject-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .reject-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>Approve Interpreted Ticket Intent?</h2>
    </div>
    <div class="container">
        <div class="content">${formatText(interpretation)}</div>
        <div class="buttons">
            <button class="reject-btn" onclick="reject()">Reject</button>
            <button class="approve-btn" onclick="approve()">Approve</button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function approve() {
            vscode.postMessage({ command: "approve" });
        }
        function reject() {
            vscode.postMessage({ command: "reject" });
        }
    </script>
</body>
</html>`;

    panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.command === "approve") {
          resolveOnce(true);
          panel.dispose();
        } else if (message.command === "reject") {
          resolveOnce(false);
          panel.dispose();
        }
      },
      undefined,
      []
    );

    panel.onDidDispose(() => {
      resolveOnce(false);
    });
  });
}
