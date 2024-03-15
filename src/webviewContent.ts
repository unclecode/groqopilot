import * as vscode from 'vscode';
import * as fs from 'fs';
import { getNonce } from './utils';

export function getHtmlForWebview(webview: vscode.Webview, extensionUri: vscode.Uri) {
    const groqopilotHtmlPath = vscode.Uri.joinPath(extensionUri, 'media', 'groqopilot.html');
    const styleResetPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'reset.css'));
    const stylesPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'vscode.css'));
    const appStylesPath = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'app.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'js', 'app.js'));
    const mediaUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media'));

    let groqopilotHtml = fs.readFileSync(groqopilotHtmlPath.fsPath, 'utf8');
    groqopilotHtml = groqopilotHtml.replace(/{{media_url}}/g, mediaUri.toString());

    const nonce = getNonce();
    return `<!DOCTYPE html>
          <html>
          <head>
              <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet">
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Groqopilot</title>
            <link href="${styleResetPath}" rel="stylesheet">
            <link href="${stylesPath}" rel="stylesheet">
            <link nonce="${nonce}" href="${appStylesPath}?${nonce}" rel="stylesheet">
          </head>
          <body>
            ${groqopilotHtml}
            <script nonce="${nonce}" src="${mediaUri}/js/utils.js"></script>
            <script nonce="${nonce}" src="${mediaUri}/js/alertHandler.js"></script>
            <script nonce="${nonce}" src="${mediaUri}/js/messageHandler.js"></script>
            <script nonce="${nonce}" src="${mediaUri}/js/microphoneHandler.js"></script>
            <script nonce="${nonce}" src="${mediaUri}/js/sessionHandler.js"></script>
            <script nonce="${nonce}" src="${mediaUri}/js/settingsHandler.js"></script>

            <script nonce="${nonce}" src="${scriptUri}" ></script>
          </body>
          </html>`;
}