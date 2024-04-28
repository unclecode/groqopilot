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

export function extractMentions(text: string) {
    const regex = /@(?:\w+\.\w+|https?:\/\/\S+)/g;
    let mentions = text.match(regex);
    
    mentions = mentions?.map(mention => {
        return {
            type: mention.startsWith('@http') ? 'url' : 'file',
            value: mention.slice(1)
        };
    });
    return mentions ? mentions : [];
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
        return null;
    }

    const absoluteFilePath = path.join(basePath, relativeFilePath);

    if (!fs.existsSync(absoluteFilePath)) {
        vscode.window.showErrorMessage(`File not found: ${relativeFilePath}`);
        return null;
    }

    try {
        const fileContent = fs.readFileSync(absoluteFilePath, 'utf8');
        return fileContent;
    } catch (error) {
        vscode.window.showErrorMessage(`Error reading file: ${relativeFilePath}`);
        return null;
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