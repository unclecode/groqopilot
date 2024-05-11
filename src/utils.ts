// @ts-nocheck

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { JSDOM } from 'jsdom';

export function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
    return {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
    };
}

export function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function getSelectedText() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const selection = editor.selection;
        if (!selection.isEmpty) {
            const selectedText = editor.document.getText(selection);
            const startLine = selection.start.line + 1;
            const endLine = selection.end.line + 1;
            let filename = editor.document.fileName;

            return {
                text: selectedText,
                filename: filename.split(/[\\/]/).pop(),
                startLine: startLine,
                endLine: endLine
            };
        } else {
            return null;
        }
    } else {
        return null;
    }
}

export function extractMentions(text: string): { type: string; value: string; }[] {
    const fileRegex = /@(?!\s)(?!https?:\/\/)\S+/g;
    const urlRegex = /@(https?:\/\/\S+)/g;
    const fileMatches = text.match(fileRegex);
    const urlMatches = text.match(urlRegex);
    let results: { type: string; value: string; }[] = [];

    if (fileMatches !== null) {
        const fileMatchesArray: string[] = Array.from(fileMatches);
        const fileResults = fileMatchesArray.map(mention => {
            return {
                type: 'file',
                value: mention.slice(1)
            };
        });
        results.push(...fileResults);
    }

    if (urlMatches !== null) {
        const urlMatchesArray: string[] = Array.from(urlMatches);
        const urlResults = urlMatchesArray.map(mention => {
            return {
                type: 'url',
                value: mention.slice(1)
            };
        });
        results.push(...urlResults);
    }

    return results;
}


// Create a function get a relative file path like "/js/core/utils.js" then connect it with project absolute root path, then open it, read content and rturn it. Check if file is in the project folder and content is not binary
export function readFileContent(relativeFilePath: string) {
    let basePath = '';

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        basePath = workspaceFolders[0].uri.fsPath;
    } else {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor && activeTextEditor.document.uri.scheme === 'file') {
            basePath = path.dirname(activeTextEditor.document.uri.fsPath);
        }
    }

    if (basePath === '') {
        vscode.window.showErrorMessage('No workspace folder or open file found.');
        return `Error: File not found: ${relativeFilePath}.\nNo workspace folder or open file found. Infor user to open a file or workspace folder or open a file in the editor.`;
    }

    const absoluteFilePath = path.join(basePath, relativeFilePath);

    if (!fs.existsSync(absoluteFilePath)) {
        vscode.window.showErrorMessage(`File not found: ${relativeFilePath}`);
        return `Error: File not found: ${relativeFilePath}.\nFile not found in the project folder. Reminder user to check the file path and try again. If you have an idea why this file is not found, please let me know. Keep it short and concise. Thanks!`;
    }

    // Check if file is a textual kind, that can be read as string, and also check length, if more thena a threshold just cap it
    let fileContent;
    try {
        fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
    } catch (error) {
        vscode.window.showErrorMessage(`Unsupported file type: ${relativeFilePath}`);
        return `Error: Unsupported file type: ${relativeFilePath}.\nThe file type is not supported for reading as text. Please provide a file with a supported textual format. If you have any questions or need assistance, please let me know.`;
    }

    // Check the file length and cap it if it exceeds a threshold
    const maxContentLength = 10000; // 1 MB
    if (fileContent.length > maxContentLength) {
        // vscode.window.showWarningMessage(`File content exceeds the maximum length. Only the first ${maxContentLength} characters will be read.`);
        fileContent = fileContent.slice(0, maxContentLength);
        // TODO: generate a summayr of file
    }

    try {
        const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
        return fileContent;
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading file: ${relativeFilePath}`);
        return `Error: File not read: ${relativeFilePath}.\nError reading file content. Reminder user to check the file path and try again. If you have an idea why this file is not read, please let me know. Keep it short and concise. Thanks!`;
    }
}



export async function fetchUrlContent(url: string) {
    try {
        const response = await fetch(url);
        const html = await response.text();

        const dom = new JSDOM(html);
        const document = dom.window.document;

        // Remove script tags
        const scriptTags = document.getElementsByTagName('script');
        for (let i = scriptTags.length - 1; i >= 0; i--) {
            scriptTags[i].parentNode.removeChild(scriptTags[i]);
        }

        // Remove style tags
        const styleTags = document.getElementsByTagName('style');
        for (let i = styleTags.length - 1; i >= 0; i--) {
            styleTags[i].parentNode.removeChild(styleTags[i]);
        }

        // Remove comments
        const comments = document.createNodeIterator(
            document.documentElement,
            dom.window.NodeFilter.SHOW_COMMENT,
            null,
            false
        );
        let comment;
        while ((comment = comments.nextNode())) {
            comment.parentNode.removeChild(comment);
        }

        // Extract the main content
        const articleTags = document.getElementsByTagName('article');
        if (articleTags.length > 0) {
            return articleTags[0].textContent.trim();
        }

        const mainTags = document.getElementsByTagName('main');
        if (mainTags.length > 0) {
            return mainTags[0].textContent.trim();
        }

        const contentTags = document.querySelectorAll('[class*="content"], [id*="content"]');
        if (contentTags.length > 0) {
            return contentTags[0].textContent.trim();
        }

        return document.body.textContent.trim();
    } catch (error) {
        console.error('Error fetching URL content:', error);
        return null;
    }
}