import * as vscode from 'vscode';
import { GroqopilotController, Message } from './groqopilotController';
import * as fs from 'fs';
import * as os from 'os';
import path from "path";
import { Blob } from 'buffer';


import OpenAI from "openai";
import * as streamifier from 'streamifier';
import { Readable } from 'stream';

import * as record from 'node-record-lpcm16';

class AudioRecorder {
    private audioRecorder: any;
    private audioPath: string = '';

    public startRecording() {
        return new Promise((resolve, reject) => {
            this.audioPath = path.join(os.tmpdir(), `recording_${Date.now()}.wav`);
            const writeStream = fs.createWriteStream(this.audioPath);

            this.audioRecorder = record.record({
                sampleRate: 16000,
                channels: 1,
                audioType: 'wav',
                threshold: 0.5,
                verbose: true,
            });

            this.audioRecorder.stream().pipe(writeStream);

            writeStream.on('finish', () => {
                resolve(this.audioPath);
            });

            writeStream.on('error', (error: any) => {
                reject(error);
            });
        });
    }

    public stopRecording(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (this.audioRecorder) {
                this.audioRecorder.stop();
                resolve(this.audioPath);
            } else {
                reject(new Error('Recording not started'));
            }
        });
    }

    public cleanup() {
        // remove the audio file
        return new Promise((resolve, reject) => {
            fs.unlink(this.audioPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(undefined);
                }
            });
        });
    }
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


class GroqopilotViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'groqopilotView';
    private _extensionUri: vscode.Uri;
    private _controller: GroqopilotController;
    private _apiKey: string | undefined;
    private _view: vscode.WebviewView | undefined;
    // private _settings: Record<string, any> = {};
    private audioRecorder: AudioRecorder;

    constructor(extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) {
        this._extensionUri = extensionUri;
        // delete groqopilotApiKey and groqopilotSettings from globalState
        // this._context.globalState.update('groqopilotApiKey', undefined);
        // this._context.globalState.update('groqopilotSettings', undefined);
        // this._context.globalState.update('groqopilotSessions', undefined);

        this._controller = new GroqopilotController(extensionUri, _context);
        this.audioRecorder = new AudioRecorder();


    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = getWebviewOptions(this._extensionUri);
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            let editor = vscode.window.activeTextEditor;
            switch (message.command) {
                case 'sendMessage':
                    const sendResult = await this._controller.sendMessage(message.content, message.context);
                    if (sendResult.status === 'success') {
                        webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) });
                    }
                    else
                        webviewView.webview.postMessage({ command: 'showError', error: sendResult.message, action: "sendMessage" });
                    break;
                case 'editMessage':
                    this._controller.editMessage(message.sessionId, message.messageIndex, message.newContent);
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) });
                    break;
                case 'deleteMessage':
                    this._controller.deleteMessage(message.sessionId, message.messageIndex);
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) });
                    break;
                case 'createNewSession':
                    this.createNewSession();
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) });
                    break;
                case 'saveApiKey':
                    // this._apiKey = message.apiKey;
                    // await this._context.globalState.update('groqopilotApiKey', this._apiKey);
                    break;
                case 'copyCode':
                    await vscode.env.clipboard.writeText(message.code);
                    vscode.window.showInformationMessage('Code copied to clipboard!');
                    break;
                case 'updateSettings':
                    console.log('updateSettings', message.settings);
                    // this._settings = message.settings;
                    // await this._context.globalState.update('groqopilotSettings', this._settings);
                    // update _controller settings
                    this._controller.setSettings(message.settings);

                    webviewView.webview.postMessage({ command: 'settingsUpdated', settings: this._controller.getSettings() });
                    break;
                case 'insertCode':
                    if (editor && editor.document.isUntitled === false) {
                        editor.edit((editBuilder) => {
                            if (editor) {
                                // if there is a selected, then replace if not then insert
                                if (!editor.selection.isEmpty) {
                                    editBuilder.replace(editor.selection, message.code);
                                } else {
                                    editBuilder.insert(editor.selection.active, message.code);
                                }

                            }
                        });
                        vscode.window.showInformationMessage('Code inserted at cursor position!');
                    } else {
                        vscode.window.showWarningMessage('No active editor or unsupported file type.');
                    }
                    break;
                case 'getSelectedText':
                    if (editor) {
                        const selection = editor.selection;
                        if (!selection.isEmpty) {
                            const selectedText = editor.document.getText(selection);
                            const startLine = selection.start.line + 1;
                            const endLine = selection.end.line + 1;
                            let filename = editor.document.fileName;

                            const selectedTextInfo = {
                                text: selectedText,
                                filename: filename.split(/[\\/]/).pop(),
                                startLine: startLine,
                                endLine: endLine
                            };

                            webviewView.webview.postMessage({ command: 'sendMessage', selectedText: selectedTextInfo, content: message.content });
                        } else {
                            webviewView.webview.postMessage({ command: 'sendMessage', selectedText: null, content: message.content });
                        }
                    } else {
                        webviewView.webview.postMessage({ command: 'sendMessage', selectedText: null, content: message.content });
                    }
                    break;
                case 'loadSession':
                    this._controller.loadSession(message.sessionId);
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(message.sessionId) });
                    break;
                case 'deleteSession':
                    this._controller.deleteSession(message.sessionId);
                    this.showSessionHistory(this.getSessions());
                    break;
                case 'startRecording':
                    await this.audioRecorder.startRecording();
                    break;
                case 'stopRecording':
                    const audioPath = await this.audioRecorder.stopRecording();
                    const transcribedText = await this.extractTextFromAudio(audioPath);
                    webviewView.webview.postMessage({ command: 'transcribedText', text: transcribedText });
                    await this.audioRecorder.cleanup();
                    break;               

            }
            // Send the API key to the WebView when the view is loaded
            // check only for the first time
            if (message.command === 'webviewReady') {
                // webviewView.webview.postMessage({ command: 'setApiKey', apiKey: this._apiKey });
                // webviewView.webview.postMessage({ command: 'getSettings', settings: this._settings });
            }
        });

        webviewView.webview.postMessage({ command: 'getSettings', settings: this._controller.getSettings() });
    }

    public createNewSession(): string {
        const sessionId = this._controller.createNewSession();
        return sessionId;
    }

    public updateCurrentSessionMessages() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) });
        }
    }


    public getSessions(): [string, Record<string, any>][] {
        return this._controller.getSessions();
    }

    public showSessionHistory(sessions: [string, Record<string, any>][]) {
        if (this._view) {
            this._view.webview.postMessage({ command: 'showSessionHistory', sessions: this.getSessions() });
        }
    }

    public showSettings() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'showSettings', settings: this._controller.getSettings() });
        }
    }

    private async saveAudioFile(audioBlob: Blob): Promise<string> {
        const audioFileName = `recording_${Date.now()}.webm`;
        const audioFilePath = path.join(os.tmpdir(), audioFileName);

        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.promises.writeFile(audioFilePath, buffer);

        return audioFilePath;
    }

    private async extractTextFromAudio(audioPath: string) {
        const openai = new OpenAI({
            apiKey: this._controller.getSettings().whisper_api_key.value,
        });
        try {
            const response = await openai.audio.transcriptions.create({
                file: fs.createReadStream(audioPath),
                model: 'whisper-1',
            });

            return response.text;
        } catch (error) {
            console.error('Failed to transcribe audio:', error);
            throw error;
        } finally {
            // Clean up the temporary file
            fs.unlinkSync(audioPath);
        }
    }

    public _getHtmlForWebview(webview: vscode.Webview) {
        const groqopilotHtmlPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'groqopilot.html');
        const styleResetPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const stylesPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const appStylesPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'app.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'app.js'));
        const mediaUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media'));

        let groqopilotHtml = fs.readFileSync(groqopilotHtmlPath.fsPath, 'utf8');
        // replace any {{media_url}} with the mediaUri
        groqopilotHtml = groqopilotHtml.replace(/{{media_url}}/g, mediaUri.toString());


        // Generate a nonce for the CSP
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
            <!-- Include any additional scripts here -->
            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
          </html>`;
    }
}


export {
    GroqopilotViewProvider,
    getWebviewOptions
};
