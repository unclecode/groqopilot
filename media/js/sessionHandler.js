function showSessionHistory(sessions) {
    
    const messageList = document.getElementById("message-list");
    const settingsElement = document.getElementById("settings");
    const sessionHistory = document.getElementById("session-history");
    const footer = document.querySelector(".groqopilot-footer");

    clearAlert();
    document.querySelector(".groqopilot-header").style.display = "none";
    messageList.style.display = "none";
    settingsElement.style.display = "none";
    sessionHistory.style.display = "flex";
    footer.style.display = "none";

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
        deleteIcon.innerHTML = "&#10005;";
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

function deleteSession(sessionId) {
    vscode.postMessage({ command: "deleteSession", sessionId: sessionId });
}

function loadSession(sessionId) {
    vscode.postMessage({ command: "loadSession", sessionId: sessionId });
}
