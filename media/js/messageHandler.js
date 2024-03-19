function createMessageElement(message) {
    const messageElement = document.createElement("div");
    const messageList = document.getElementById("message-list");

    messageElement.classList.add("message");
    messageElement.classList.add(message.role);
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
        messageElement.contentEditable = true;
        messageElement.focus();
        messageElement.classList.add("editing");
        messageElement.addEventListener("blur", () => {
            messageElement.contentEditable = false;
            
            const newContent = messageElement.querySelector(".content").textContent;
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

function updateMessageList(messages) {
    const messageList = document.getElementById("message-list");
    const sessionHistory = document.getElementById("session-history");
    const settingsElement = document.getElementById("settings");
    const footer = document.querySelector(".groqopilot-footer");
    clearAlert();
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

    // scroll to the beginning of the last message
    messageList.scrollTop = messageList.scrollHeight;
    hljs.highlightAll();
}

function addCodeActionIcons(preElement) {
    const codeActionsContainer = document.createElement("div");
    codeActionsContainer.classList.add("code-actions");

    const wrapCodeIcon = document.createElement("div");
    wrapCodeIcon.classList.add("wrap-code-icon");
    wrapCodeIcon.setAttribute("title", "Toggle wrap");
    wrapCodeIcon.addEventListener("click", () => {
        // toggle wrap class for preElement
        preElement.classList.toggle("wrap");
    });

    const copyCodeIcon = document.createElement("div");
    copyCodeIcon.classList.add("copy-code-icon");
    copyCodeIcon.setAttribute("title", "Copy code");
    copyCodeIcon.addEventListener("click", () => {
        const code = preElement.innerText;
        vscode.postMessage({ command: "copyCode", code: code });
    });

    const insertCodeIcon = document.createElement("div");
    insertCodeIcon.classList.add("insert-code-icon");
    insertCodeIcon.setAttribute("title", "Insert code");
    insertCodeIcon.addEventListener("click", () => {
        const code = preElement.innerText;
        vscode.postMessage({ command: "insertCode", code: code });
    });

    codeActionsContainer.appendChild(wrapCodeIcon);
    codeActionsContainer.appendChild(copyCodeIcon);
    codeActionsContainer.appendChild(insertCodeIcon);
    preElement.appendChild(codeActionsContainer);
}

function setExample(aTag) {
    const messageInput = document.getElementById("message-input");

    const message = aTag.getAttribute("data-example");
    messageInput.value = message;
    adjustTextareaHeight(messageInput);
}
