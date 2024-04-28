// import { createMessageElement, updateMessageList, addCodeActionIcons, setExample } from "./messageHandler.js";
// import { showSessionHistory, deleteSession, loadSession } from "./sessionHandler.js";
// import { showSettings, checkSettingValidity } from "./settingsHandler.js";
// import { setAlert, clearAlert } from "./alertHandler.js";
// import { handleMicrophoneClick } from "./microphoneHandler.js";

let vscode = null;
let activeSessionId = null;
const showSettingsTab = () => {
    if (window._settings) {
        showSettings(window._settings);
    }
};
(function () {
    vscode = acquireVsCodeApi();

    const newSessionBtn = document.getElementById("new-session-btn");
    const messageList = document.getElementById("message-list");
    const messageInput = document.getElementById("message-input");
    const sendMessageBtn = document.getElementById("send-message-btn");
    const micBtn = document.getElementById("microphone-btn");
    const sessionHistory = document.getElementById("session-history");
    const settingsElement = document.getElementById("settings");
    const footer = document.querySelector(".groqopilot-footer");
    const alert = document.querySelector("#topAlert");
    const alertContent = document.querySelector(".alert .content");
    const alertCloseBtn = document.querySelector(".alert .close");

    alertCloseBtn.addEventListener("click", () => {
        clearAlert();
    });

    messageInput.addEventListener("input", () => adjustTextareaHeight(messageInput));
    messageInput.addEventListener("keydown", (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            sendMessageBtn.click();
        }
    });
    messageInput.addEventListener("focus", () => {
        document.querySelector(".message-input-section").classList.add("focused");
    });
    messageInput.addEventListener("blur", () => {
        document.querySelector(".message-input-section").classList.remove("focused");
    });

    const exampleATags = document.querySelectorAll(".example a");
    exampleATags.forEach((aTag) => {
        aTag.addEventListener("click", () => setExample(aTag));
    });

    

    sendMessageBtn.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message) {
            // vscode.postMessage({ command: "getSelectedText", content: message });

            const sendingMessage = createMessageElement({ role: "status", content: `Sending: ${message}` });
            messageList.appendChild(sendingMessage);
            let content = message;
            let context = "";
            vscode.postMessage({ command: "sendMessage", content: content, context: context });

            messageInput.value = "";
            adjustTextareaHeight(messageInput);
        }
    });

    // TODO: Fix this later
    micBtn.addEventListener("click", handleMicrophoneClick);

    window.addEventListener("message", (event) => {
        const message = event.data;
        const messageElement = document.createElement("div");
        switch (message.command) {
            case "updateMessages":
                activeSessionId = message.sessionId;
                updateMessageList(message.messages);
                break;
            case "setApiKey":
                // apiKeyInput.value = message.apiKey || "";
                break;
            case "addMessage":
                messageElement.classList.add("message", message.type);
                messageElement.innerHTML = message.message;
                document.getElementById("message-list").appendChild(messageElement);

                const preElements = messageElement.querySelectorAll("pre");
                preElements.forEach((preElement) => {
                    addCodeActionIcons(preElement);
                });
                break;
            case "sendMessage":
                console.log(message.selectedText);
                const sendingMessage = createMessageElement({ role: "status", content: `Sending: ${message.content}` });
                messageList.appendChild(sendingMessage);

                let content = message.content;
                let context = "";
                if (message.selectedText) {
                    const selectedTextInfo = message.selectedText;
                    const formattedText = `\`\`\`${message.selectedText.filename}\n${selectedTextInfo.text}\n\`\`\``;
                    const messageText = `<context>[Selected code from ${selectedTextInfo.filename} (lines ${selectedTextInfo.startLine}-${selectedTextInfo.endLine})]\n${formattedText}\n</context>`;
                    context = messageText;
                }

                vscode.postMessage({ command: "sendMessage", content: content, context: context });
                break;
            case "showSessionHistory":
                showSessionHistory(message.sessions);
                break;
            case "showSettings":
                // set setting to global scope
                window._settings = message.settings;
                showSettings(message.settings);
                checkSettingValidity(message.settings);
                break;
            case "getSettings":
                window._settings = message.settings;
                if (!checkSettingValidity(message.settings)){
                    showSettings(message.settings);
                    const htmlMessage = `<p>To start please set your GROQ API Key.<br><small>Do not forget to click on the "Save Settings" button.</small></p>`;
                    setAlert(htmlMessage, "info");
                }
                break;
            case "settingsUpdated":
                if (checkSettingValidity(message.settings)) {
                    setAlert("Settings updated successfully", "info", 1000);
                    vscode.postMessage({ command: "createNewSession" });
                    window._settings = message.settings;
                    hideSettings();
                }
                else {
                    setAlert("Oops! Seems API Key is not set. Please set it and try again.", "error");
                }
                break;
            case "showError":
                setAlert(message.error, "error");
                break;
            case "transcribedText":
                messageInput.value = message.text;
                adjustTextareaHeight(messageInput);
                micBtn.classList.remove("recording");
                micBtn.querySelector("img:first-child").style.display = "inline-block";
                micBtn.querySelector("img.recording").style.display = "none";
                micBtn.querySelector("img.loading").style.display = "none";
                break;
        }
    });

    vscode.postMessage({ command: "webviewReady" });
})();
