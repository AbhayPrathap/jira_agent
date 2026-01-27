import * as vscode from "vscode";

export interface ChatReplyWaiterCallbacks {
  onClipboardDetected: (clipboardContent: string) => Promise<void>;
  onCancel?: () => void;
}

export async function waitForChatReply(
  previousClipboard: string,
  callbacks: ChatReplyWaiterCallbacks
): Promise<void> {
  return new Promise<void>((resolve) => {
    const panel = vscode.window.createWebviewPanel(
      "waitForChatReply",
      "Waiting for Chat Reply",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    const checkClipboard = async () => {
      const currentClipboard = await vscode.env.clipboard.readText();
      if (
        currentClipboard &&
        currentClipboard.trim().length > 0 &&
        currentClipboard !== previousClipboard
      ) {
        panel.dispose();
        await callbacks.onClipboardDetected(currentClipboard);
        resolve();
      } else {
        vscode.window.showWarningMessage(
          "No changes detected in clipboard. Please make sure you've copied the chat reply."
        );
      }
    };

    panel.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waiting for Chat Reply</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            margin: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            max-width: 500px;
        }
        h2 {
            margin-top: 0;
            color: var(--vscode-foreground);
        }
        .instructions {
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            line-height: 1.6;
        }
        .button {
            padding: 12px 24px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            margin: 10px;
            min-width: 150px;
        }
        .check-btn {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .check-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .cancel-btn {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .cancel-btn:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            font-size: 13px;
        }
        .status.waiting {
            background-color: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Waiting for Chat Reply</h2>
        <div class="instructions">
            <p><strong>Instructions:</strong></p>
            <ol style="text-align: left; padding-left: 20px;">
                <li>Run the promt and wait for the response</li>
                <li>Select and copy the last chat reply</li>
                <li>Click "I've Copied" button below</li>
            </ol>
        </div>
        <div>
            <button class="button check-btn" onclick="checkClipboard()">I've Copied</button>
            <button class="button cancel-btn" onclick="cancel()">Cancel</button>
        </div>
        <div class="status waiting" id="status">
            Waiting for you to copy the chat reply...
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        function checkClipboard() {
            vscode.postMessage({ command: "checkClipboard" });
        }
        function cancel() {
            vscode.postMessage({ command: "cancel" });
        }
    </script>
</body>
</html>`;

    panel.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "checkClipboard") {
          await checkClipboard();
        } else if (message.command === "cancel") {
          panel.dispose();
          if (callbacks.onCancel) {
            callbacks.onCancel();
          }
          resolve();
        }
      },
      undefined,
      []
    );

    panel.onDidDispose(() => {
      resolve();
    });
  });
}
