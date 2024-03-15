// Utility function to create a message element
function adjustTextareaHeight(messageInput) {
    messageInput.style.height = "auto";
    messageInput.style.height = `${
        messageInput.scrollHeight - messageInput.clientHeight + messageInput.offsetHeight
    }px`;
}



(function () {
    const vscode = acquireVsCodeApi();

    // const apiKeyInput = document.getElementById("api-key-input");
    // const saveApiKeyBtn = document.getElementById("save-api-key-btn");
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
    // if meesgae input got focus add "focused" class to div.message-input-section
    messageInput.addEventListener("focus", () => {
        document.querySelector(".message-input-section").classList.add("focused");
    });

    // if meesgae input lost focus remove "focused" class to div.message-input-section
    messageInput.addEventListener("blur", () => {
        document.querySelector(".message-input-section").classList.remove("focused");
    });

    const exampleATags = document.querySelectorAll(".example a");
    exampleATags.forEach((aTag) => {
        aTag.addEventListener("click", () => setExample(aTag));
    });

    let activeSessionId = null;

    // Event listener for saving the API key
    // saveApiKeyBtn.addEventListener("click", () => {
    //     const apiKey = apiKeyInput.value.trim();
    //     if (apiKey) {
    //         vscode.postMessage({ command: "saveApiKey", apiKey });
    //     }
    // });

    // Event listener for creating a new session
    // newSessionBtn.addEventListener("click", () => {
    //     vscode.postMessage({ command: "createNewSession" });
    // });

    // Event listener for sending a message
    sendMessageBtn.addEventListener("click", () => {
        const message = messageInput.value.trim();
        if (message) {
            const sendingMEssage = createMessageElement({ role: "status", content: `Sending: ${message}` });
            messageList.appendChild(sendingMEssage);
            
            vscode.postMessage({ command: "getSelectedText", content: message });
            messageInput.value = "";
            adjustTextareaHeight(messageInput);
        }
    });

    // Function to create a message element
    function createMessageElement(message) {
        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        messageElement.classList.add(message.role);
        // Add a circular avatar icon, then the message content, use flex layout
        const svg_grow = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="20" zoomAndPan="magnify" viewBox="0 0 600 599.999999" height="20" fill="#444" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="94173fb402"><path d="M 130.390625 52.277344 L 469.390625 52.277344 L 469.390625 547.84375 L 130.390625 547.84375 Z M 130.390625 52.277344 " clip-rule="nonzero"/></clipPath></defs><g clip-path="url(#94173fb402)"><path fill="#fff" d="M 300.203125 51.65625 C 206.570312 51.65625 130.390625 127.8125 130.390625 221.417969 C 130.390625 315.019531 206.570312 391.179688 300.203125 391.179688 L 356.058594 391.179688 L 356.058594 327.5 L 300.203125 327.5 C 241.671875 327.5 194.054688 279.898438 194.054688 221.382812 C 194.054688 162.871094 241.671875 115.269531 300.203125 115.269531 C 358.738281 115.269531 406.582031 162.871094 406.582031 221.382812 L 406.582031 377.75 C 406.582031 435.871094 359.226562 483.214844 301.25 483.832031 C 273.339844 483.539062 247.164062 472.53125 227.390625 452.796875 L 182.355469 497.816406 C 213.890625 529.34375 255.625 546.921875 300.105469 547.511719 C 300.5 547.511719 300.859375 547.511719 301.25 547.511719 C 301.644531 547.511719 302.035156 547.511719 302.425781 547.511719 C 394.753906 546.234375 469.496094 470.992188 469.921875 378.5 L 469.984375 217.203125 C 467.761719 125.496094 392.464844 51.589844 300.203125 51.589844 Z M 300.203125 51.65625 " fill-opacity="1" fill-rule="nonzero"/></g></svg>`;
        const g = message.role == "assistant" ? svg_grow : "y";
        messageElement.innerHTML = `
            <div class="message-header">
            <div class="avatar inter inter-400">${g}</div>
            <div class="message-sender">${message.role == "assistant" ? "Groqopilot" : "You"}</div>
            </div>
            <div class="content"></div>
        `;
        const messageContent = messageElement.querySelector(".content");

        if (message.formatedContent) {
            messageContent.innerHTML = message.formatedContent;
            messageContent.querySelectorAll("pre").forEach((pre) => addCodeActionIcons(pre));
        } else {
            messageContent.textContent = message.content;
        }

        // Double-click event listener for editing the message
        messageElement.addEventListener("dblclick", () => {
            // make the message to be content editable and then listen to its input event
            messageElement.contentEditable = true;
            messageElement.focus();
            // add a class
            messageElement.classList.add("editing");
            // when user click outside the message, the message will be saved
            messageElement.addEventListener("blur", () => {
                messageElement.contentEditable = false;
                const newContent = messageElement.textContent;
                messageElement.classList.remove("editing");
                if (newContent !== message.content) {
                    vscode.postMessage({
                        command: "editMessage",
                        sessionId: activeSessionId,
                        messageIndex: Array.from(messageList.children).indexOf(messageElement),
                        newContent,
                    });
                }
            });
        });

        // Context menu event listener for message actions
        messageElement.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            const messageIndex = Array.from(messageList.children).indexOf(messageElement);
            const messageActions = [
                {
                    label: "Edit",
                    click: () => {
                        const newContent = prompt("Edit message:", message.content);
                        if (newContent !== null) {
                            vscode.postMessage({
                                command: "editMessage",
                                sessionId: activeSessionId,
                                messageIndex,
                                newContent,
                            });
                        }
                    },
                },
                {
                    label: "Delete",
                    click: () => {
                        vscode.postMessage({
                            command: "deleteMessage",
                            sessionId: activeSessionId,
                            messageIndex,
                        });
                    },
                },
            ];
            vscode.postMessage({ command: "showMessageActions", messageActions });
        });

        return messageElement;
    }

    // Function to update the message list
    function updateMessageList(messages) {
        clearAlert();
        // remove any status messages
        document.querySelector(".groqopilot-header").style.display = "flex";
        messageList.style.display = "flex";
        sessionHistory.style.display = "none";
        settingsElement.style.display = "none";
        footer.style.display = "flex";
        const statusMessages = messageList.querySelectorAll(".status");
        statusMessages.forEach((message) => message.remove());
        messageList.innerHTML = "";
        messages.forEach((message) => {
            const messageElement = createMessageElement(message);
            messageList.appendChild(messageElement);
        });
    }

    function addCodeActionIcons(preElement) {
        const codeActionsContainer = document.createElement("div");
        codeActionsContainer.classList.add("code-actions");

        const copyCodeIcon = document.createElement("div");
        copyCodeIcon.classList.add("copy-code-icon");
        copyCodeIcon.addEventListener("click", () => {
            const code = preElement.innerText;
            vscode.postMessage({ command: "copyCode", code: code });
        });

        const insertCodeIcon = document.createElement("div");
        insertCodeIcon.classList.add("insert-code-icon");
        insertCodeIcon.addEventListener("click", () => {
            const code = preElement.innerText;
            vscode.postMessage({ command: "insertCode", code: code });
        });

        codeActionsContainer.appendChild(copyCodeIcon);
        codeActionsContainer.appendChild(insertCodeIcon);
        preElement.appendChild(codeActionsContainer);
    }

    function setExample(aTag) {
        const message = aTag.getAttribute("data-example");
        messageInput.value = message;
        adjustTextareaHeight(messageInput);
    }

    function showSessionHistory(sessions) {
        clearAlert();
        document.querySelector(".groqopilot-header").style.display = "none";
        messageList.style.display = "none";
        settingsElement.style.display = "none";
        sessionHistory.style.display = "flex";
        footer.style.display = "none";

        // iterate through sessionHistory and remove all children
        while (sessionHistory.firstChild) {
            sessionHistory.removeChild(sessionHistory.firstChild);
        }

        let anySessionFound = false;

        sessions.forEach(([sessionId, sessionData]) => {
            if (sessionData.messages.length === 0) {
                return;
            }
            anySessionFound = true;
            const sessionElement = document.createElement("div");
            sessionElement.classList.add("session-item");
            sessionElement.classList.add("message");

            let firstMessage = sessionData.messages[0];

            const messageContent = document.createElement("div");
            messageContent.classList.add("message-content");
            messageContent.textContent = firstMessage.content;
            sessionElement.appendChild(messageContent);

            if (firstMessage.readableDateAndTime) {
                const dateTimeElement = document.createElement("div");
                dateTimeElement.classList.add("message-datetime");
                dateTimeElement.textContent = firstMessage.readableDateAndTime;
                sessionElement.appendChild(dateTimeElement);
            }

            const deleteIcon = document.createElement("div");
            deleteIcon.classList.add("delete-icon");
            deleteIcon.innerHTML = "&#10005;"; // Cross icon
            deleteIcon.addEventListener("click", (event) => {
                event.stopPropagation();
                deleteSession(sessionId);
            });
            sessionElement.appendChild(deleteIcon);

            sessionElement.addEventListener("click", () => {
                loadSession(sessionId);
            });
            sessionHistory.appendChild(sessionElement);
        });

        if (!anySessionFound) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message", "info");
            messageElement.textContent = "No session history found";
            sessionHistory.appendChild(messageElement);
        }
    }

    function showSettings(settings) {
        clearAlert();
        document.querySelector(".groqopilot-header").style.display = "none";
        messageList.style.display = "none";
        sessionHistory.style.display = "none";
        footer.style.display = "none";
        const settingsElement = document.getElementById("settings");
        settingsElement.style.display = "flex";

        // Clear any existing settings
        while (settingsElement.firstChild) {
            settingsElement.removeChild(settingsElement.firstChild);
        }

        // Add header row "Setting" and submt button in same row, use flex
        const headerRow = document.createElement("div");
        headerRow.classList.add("setting-header");
        settingsElement.appendChild(headerRow);

        const settingLabel = document.createElement("div");
        settingLabel.textContent = "Setting";
        // set flex to 1
        settingLabel.style.flex = "1";
        headerRow.appendChild(settingLabel);

        const settingSubmitButton = document.createElement("button");
        settingSubmitButton.classList.add("button");
        settingSubmitButton.textContent = "Save Settings";
        settingSubmitButton.addEventListener("click", () => {
            const updatedSettings = {};
            settingsElement.querySelectorAll(".setting-item").forEach((settingElement) => {
                const type = settingElement.dataset.type;
                if (type === "string" || type === "number" || type === "text" || type === "password") {
                    const key = settingElement.querySelector("label").textContent;
                    const inputElement =
                        type !== "text"
                            ? settingElement.querySelector("input")
                            : settingElement.querySelector("textarea");
                    updatedSettings[key.toLowerCase().replace(/\s/g, "_")] = {
                        type: type,
                        value: type === "number" ? Number(inputElement.value) : inputElement.value,
                    };
                } else if (type === "boolean") {
                    const key = settingElement.querySelector("label").textContent;
                    const inputElement = settingElement.querySelector("input");
                    updatedSettings[key.toLowerCase().replace(/\s/g, "_")] = {
                        type: type,
                        label: key,
                        value: inputElement.checked,
                    };
                } else if (type === "enum" || type === "array") {
                    const key = settingElement.querySelector("label").textContent;
                    const selectElement = settingElement.querySelector("select");
                    let selectedOption = "";
                    const value = Array.from(selectElement.options).map((option) => {
                        return option.value;
                    });
                    selectedOption = selectElement.options[selectElement.selectedIndex].value;
                    let selectedOptionValue = selectElement.options[selectElement.selectedIndex].textContent;
                    updatedSettings[key.toLowerCase().replace(/\s/g, "_")] = {
                        type: type,
                        value: value,
                        selected: selectedOption,
                    };
                }
            });
            vscode.postMessage({ command: "updateSettings", settings: updatedSettings });
            // create new session
            // vscode.postMessage({ command: "createNewSession" });
        });
        headerRow.appendChild(settingSubmitButton);

        // Iterate through the settings and create input fields
        for (const key in settings) {
            const settingElement = document.createElement("div");
            settingElement.classList.add("setting-item");

            const labelElement = document.createElement("label");
            labelElement.textContent = key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
            settingElement.appendChild(labelElement);

            const value = settings[key]["value"];
            const type = settings[key]["type"];
            settingElement.dataset.type = type;
            if (type === "string") {
                const inputElement = document.createElement("input");
                inputElement.classList.add("input-box");
                inputElement.type = key == "text";
                inputElement.value = value;
                settingElement.appendChild(inputElement);
            } else if (type == "password") {
                const inputElement = document.createElement("input");
                inputElement.classList.add("input-box");
                inputElement.type = "password";
                inputElement.value = value;
                settingElement.appendChild(inputElement);
            } else if (type == "text") {
                const inputElement = document.createElement("textarea");
                inputElement.classList.add("input-box");
                inputElement.value = value;
                inputElement.rows = 5;
                settingElement.appendChild(inputElement);
            } else if (type === "number") {
                const inputElement = document.createElement("input");
                inputElement.classList.add("input-box");
                inputElement.type = "number";
                inputElement.value = value;
                settingElement.appendChild(inputElement);
            } else if (type === "boolean") {
                const inputElement = document.createElement("input");
                inputElement.classList.add("input-box");
                inputElement.type = "checkbox";
                inputElement.checked = value;
                settingElement.appendChild(inputElement);
            } else if (type === "enum") {
                const selectElement = document.createElement("select");
                selectElement.classList.add("input-box");
                value.forEach((option) => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option;
                    optionElement.textContent = option;
                    optionElement.selected = option == value.selected;
                    selectElement.appendChild(optionElement);
                });
                settingElement.appendChild(selectElement);
            } else if (type === "array") {
                const selectElement = document.createElement("select");
                value.forEach((option) => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option;
                    optionElement.textContent = option;
                    optionElement.selected = option == value.selected;
                    selectElement.appendChild(optionElement);
                });
                settingElement.appendChild(selectElement);
            }

            settingsElement.appendChild(settingElement);
        }

        // Add a save button
        // const saveButton = document.createElement("button");
        // saveButton.classList.add("button");
        // saveButton.textContent = "Save Settings";
        // saveButton.addEventListener("click", () => {
        //     const updatedSettings = {};
        //     settingsElement.querySelectorAll(".setting-item").forEach((settingElement) => {
        //         const key = settingElement.querySelector("label").textContent;
        //         const inputElement = settingElement.querySelector("input, select");
        //         updatedSettings[key] = inputElement.value;
        //     });
        //     vscode.postMessage({ command: "updateSettings", settings: updatedSettings });
        // });
        // settingsElement.appendChild(saveButton);
    }

    function deleteSession(sessionId) {
        vscode.postMessage({ command: "deleteSession", sessionId: sessionId });
    }

    function loadSession(sessionId) {
        vscode.postMessage({ command: "loadSession", sessionId: sessionId });
    }

    function setAlert(message, alert_type = "info", timer = -1) {
        alertContent.textContent = message;
        alert.classList.add(alert_type);
        alert.style.display = "flex";
        if (timer > 0) {
            setTimeout(() => {
                clearAlert();
            }, timer);
        }
    }
    function clearAlert() {
        alert.classList.remove("info");
        alert.classList.remove("error");
        alert.classList.remove("warning");
        alert.classList.remove("success");

        alertContent.textContent = "";
        alert.style.display = "none";
    }

    function checkSettingValidity(settings) {
        if(!settings.whisper_api_key.value) {
            // Hide the mic button 
            micBtn.style.display = "none";
        }
        else {
            micBtn.style.display = "flex";
        }
        if (!settings.api_key.value) {
            setAlert("API Key is not set. Update it in the settings.", "warning");
            footer.style.display = "none";
            return false;
        } else {
            clearAlert();
            footer.style.display = "flex";
            return true;
        }
    }

    let isRecording = false;

    function handleMicrophoneClick() {
        if (isRecording) {
            // Stop recording
            vscode.postMessage({ command: 'stopRecording' });
            isRecording = false;
            micBtn.querySelector('img:first-child').style.display = 'none';
            micBtn.querySelector('img.recording').style.display = 'none';
            micBtn.querySelector('img.loading').style.display = 'inline-block';
        } else {
            // Start recording
            vscode.postMessage({ command: 'startRecording' });
            isRecording = true;
            micBtn.querySelector('img:first-child').style.display = 'none';
            micBtn.querySelector('img.recording').style.display = 'inline-block';
            micBtn.querySelector('img.loading').style.display = 'none';
            micBtn.classList.add('recording');
        }
    }

    micBtn.addEventListener("click", handleMicrophoneClick);

    // Handle messages from the extension
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
                // const sendingMEssage = createMessageElement({ role: "status", content: `Sending: ${message.content}` });
                // messageList.appendChild(sendingMEssage);

                content = message.content;
                let context = "";
                if (message.selectedText) {
                    const selectedTextInfo = message.selectedText;
                    const formattedText = `\`\`\`${message.selectedText.filename}\n${selectedTextInfo.text}\n\`\`\``;
                    const messageText = `<context>[Selected code from ${selectedTextInfo.filename} (lines ${selectedTextInfo.startLine}-${selectedTextInfo.endLine})]\n${formattedText}\n</context>`;
                    context = messageText;
                    // content = `${messageText}\n\nUse above context and handle this programming request. ${message.content}`;
                }

                vscode.postMessage({ command: "sendMessage", content: content, context: context });
                break;
            case "showSessionHistory":
                showSessionHistory(message.sessions);
                break;
            case "showSettings":
                showSettings(message.settings);
                checkSettingValidity(message.settings);
                break;
            case "getSettings":
                // If no api key is set, aert it and askuser to go settings and set it
                checkSettingValidity(message.settings);
                break;
            case "settingsUpdated":
                if (checkSettingValidity(message.settings)) {
                    setAlert("Settings updated successfully", "info", 1000);
                    vscode.postMessage({ command: "createNewSession" });
                }
                break;
            case "showError":
                setAlert(message.error, "error");
                break;                      
            case 'transcribedText':
                messageInput.value = message.text;
                adjustTextareaHeight(messageInput);
                micBtn.classList.remove('recording');
                micBtn.querySelector('img:first-child').style.display = 'inline-block';
                micBtn.querySelector('img.recording').style.display = 'none';
                micBtn.querySelector('img.loading').style.display = 'none';    
                break;
        }
    });

    // Send a message to the extension indicating that the webview is ready
    vscode.postMessage({ command: "webviewReady" });
})();
