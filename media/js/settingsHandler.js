function showSettings(settings) {
    clearAlert();

    const messageList = document.getElementById("message-list");
    const sessionHistory = document.getElementById("session-history");
    const settingsElement = document.getElementById("settings");
    const footer = document.querySelector(".groqopilot-footer");


    document.querySelector(".groqopilot-header").style.display = "none";
    messageList.style.display = "none";
    sessionHistory.style.display = "none";
    footer.style.display = "none";
    settingsElement.style.display = "flex";

    while (settingsElement.firstChild) {
        settingsElement.removeChild(settingsElement.firstChild);
    }

    const headerRow = document.createElement("div");
    headerRow.classList.add("setting-header");
    settingsElement.appendChild(headerRow);

    const settingLabel = document.createElement("div");
    settingLabel.textContent = "Setting";
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
                    type !== "text" ? settingElement.querySelector("input") : settingElement.querySelector("textarea");
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
    });
    headerRow.appendChild(settingSubmitButton);

    for (const key in settings) {
        // TODO: Temporary
        if ( false && key == "whisper_api_key" ) 
            continue;
        
        const settingElement = document.createElement("div");
        settingElement.classList.add("setting-item");

        const labelElement = document.createElement("label");
        labelElement.textContent = key.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()) ;
        // if settings[key]["description"] exists att another label within small tage with the description
        let smallElement
        if (settings[key]["description"]) {
            smallElement = document.createElement("small");
            smallElement.classList.add("setting-description");
            smallElement.textContent = settings[key]["description"];
        }

        settingElement.appendChild(labelElement);
        if (smallElement) {
            settingElement.appendChild(smallElement);
        }

        const value = settings[key]["value"];
        const type = settings[key]["type"];
        settingElement.dataset.type = type;
        if (type === "string") {
            const inputElement = document.createElement("input");
            inputElement.classList.add("input-box");
            inputElement.type = "text";
            inputElement.value = value;
            settingElement.appendChild(inputElement);
        } else if (type === "password") {
            const inputElement = document.createElement("input");
            inputElement.classList.add("input-box");
            inputElement.type = "password";
            inputElement.value = value;
            settingElement.appendChild(inputElement);
        } else if (type === "text") {
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
        } else if (type === "enum" || type === "array") {
            const selectElement = document.createElement("select");
            selectElement.classList.add("input-box");
            value.forEach((option) => {
                const optionElement = document.createElement("option");
                optionElement.value = option;
                optionElement.textContent = option;
                optionElement.selected = option === settings[key].selected;
                selectElement.appendChild(optionElement);
            });
            settingElement.appendChild(selectElement);
        }

        settingsElement.appendChild(settingElement);
    }
}

function checkSettingValidity(settings) {
    const micBtn = document.getElementById("microphone-btn");
    const footer = document.querySelector(".groqopilot-footer");
    
    if (!settings.whisper_api_key.value) {
        micBtn.style.display = "none";
    } else {
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
