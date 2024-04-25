import * as vscode from 'vscode';
import { GroqopilotController, Message } from './groqopilotController';
import { AudioRecorder } from './audioRecorder';
import { getWebviewOptions } from './utils';
import { extractTextFromAudio } from './audioTranscription';
import { getHtmlForWebview } from './webviewContent';

class GroqopilotViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'groqopilotView';
    private _extensionUri: vscode.Uri;
    private _controller: GroqopilotController;
    private _view: vscode.WebviewView | undefined;
    private audioRecorder: AudioRecorder;

    constructor(extensionUri: vscode.Uri, private readonly _context: vscode.ExtensionContext) {
        // _context.globalState.update('groqopilotApiKey', undefined);
        // _context.globalState.update('groqopilotSettings', undefined);
        // _context.globalState.update('groqopilotSessions', undefined);   

        this._extensionUri = extensionUri;
        this._controller = new GroqopilotController(extensionUri, _context);
        this.audioRecorder = new AudioRecorder();
    }

    public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        webviewView.webview.options = getWebviewOptions(this._extensionUri);
        webviewView.webview.html = getHtmlForWebview(webviewView.webview, this._extensionUri);

        webviewView.webview.onDidReceiveMessage(async (message) => {
            let editor = vscode.window.activeTextEditor;
            switch (message.command) {
                case 'sendMessage':
                    const sendResult = await this._controller.sendMessage(message.content, message.context);
                    if (sendResult.status === 'success') {
                        webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) , sessionId: message.sessionId});
                    }
                    else
                        webviewView.webview.postMessage({ command: 'showError', error: sendResult.message, action: "sendMessage" });
                    break;
                case 'editMessage':
                    const editedMessage = await this._controller.editMessage(message.sessionId, message.messageIndex, message.newContent);
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']) , sessionId: message.sessionId});
                    break;
                case 'deleteMessage':
                    await this._controller.deleteMessage(message.sessionId, message.messageIndex);
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']), sessionId: message.sessionId });
                    break;
                case 'createNewSession':
                    this.createNewSession();
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']), sessionId: message.sessionId });
                    break;
                case 'copyCode':
                    await vscode.env.clipboard.writeText(message.code);
                    vscode.window.showInformationMessage('Code copied to clipboard!');
                    break;
                case 'updateSettings':
                    console.log('updateSettings', message.settings);
                    this._controller.setSettings(message.settings);

                    webviewView.webview.postMessage({ command: 'settingsUpdated', settings: this._controller.getSettings() });
                    break;
                case 'resetSettings':
                    this._controller.resetSettings();
                    webviewView.webview.postMessage({ command: 'getSettings', settings: this._controller.getSettings() });
                    break;
                case 'insertCode':
                    if (editor && editor.document.isUntitled === false) {
                        editor.edit((editBuilder) => {
                            if (editor) {
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
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(message.sessionId), sessionId: message.sessionId });
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
                    const transcribedText = await extractTextFromAudio(audioPath, this._controller.getSettings().whisper_api_key.value);
                    webviewView.webview.postMessage({ command: 'transcribedText', text: transcribedText });
                    await this.audioRecorder.cleanup();
                    break;               

            }
            if (message.command === 'webviewReady') {
                webviewView.webview.postMessage({ command: 'getSettings', settings: this._controller.getSettings() });
                if (this._controller['_activeSessionId']){
                    webviewView.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']), sessionId: this._controller['_activeSessionId'] });
                }
                }
        });

        // If this._controller.getSettings() is not {} then send the settings to the webview
        if (Object.keys(this._controller.getSettings()).length !== 0) {
            webviewView.webview.postMessage({ command: 'getSettings', settings: this._controller.getSettings() });
        }

        
    }

    public createNewSession(): string {
        const sessionId = this._controller.createNewSession();
        return sessionId;
    }

    public updateCurrentSessionMessages() {
        if (this._view) {
            this._view.webview.postMessage({ command: 'updateMessages', messages: this._controller.getSessionMessages(this._controller['_activeSessionId']), sessionId: this._controller['_activeSessionId'] });
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
}

export {
    GroqopilotViewProvider
};