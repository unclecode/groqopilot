import * as vscode from 'vscode';
import { GroqopilotViewProvider } from './groqopilotViewProvider';
import { getWebviewOptions } from './utils';
import * as fs from 'fs';
export function activate(context: vscode.ExtensionContext) {
    const provider = new GroqopilotViewProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(GroqopilotViewProvider.viewType, provider)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groqopilot.autoComplete', () => {
            // alert user this will be released soon
            vscode.window.showInformationMessage('This feature will be released soon, I know you are excited, so am I. Stay tuned');
            //TODO: provider.autoComplete();

        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('groqopilot.openPanel', () => {
            const panel = vscode.window.createWebviewPanel(
                GroqopilotViewProvider.viewType,
                'Groqopilot',
                vscode.ViewColumn.One,
                getWebviewOptions(context.extensionUri)
            );
            // panel.webview.html = provider._getHtmlForWebview(panel.webview);
        })
    );
    context.subscriptions.push(
        vscode.commands.registerCommand('groqopilot.newSession', () => {
            provider.createNewSession();
            provider.updateCurrentSessionMessages();
        })
    );
    // push showHistory
    context.subscriptions.push(
        vscode.commands.registerCommand('groqopilot.showHistory', () => {
            const sessions = provider.getSessions();
            provider.showSessionHistory(sessions);
            // vscode.window.showInformationMessage('Show History');
        })
    );
    // push showSettings
    context.subscriptions.push(
        vscode.commands.registerCommand('groqopilot.showSettings', () => {
            provider.showSettings();
            // vscode.window.showInformationMessage('Show Settings');
        })
    );

    // // Register the acceptSuggestion command
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('groqopilot.acceptSuggestion', () => {
    //         vscode.commands.executeCommand('acceptSuggestion');
    //     })
    // );

    // // Register the nextSuggestion command
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('groqopilot.nextSuggestion', () => {
    //         vscode.commands.executeCommand('nextSuggestion');
    //     })
    // );

    // // Register the previousSuggestion command
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('groqopilot.previousSuggestion', () => {
    //         vscode.commands.executeCommand('previousSuggestion');
    //     })
    // );

    // // Register the cancelSuggestion command
    // context.subscriptions.push(
    //     vscode.commands.registerCommand('groqopilot.cancelSuggestion', () => {
    //         vscode.commands.executeCommand('cancelSuggestion');
    //     })
    // );
}

