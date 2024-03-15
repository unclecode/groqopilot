let isRecording = false;

function handleMicrophoneClick() {
    const micBtn = document.getElementById("microphone-btn");

    if (isRecording) {
        vscode.postMessage({ command: "stopRecording" });
        isRecording = false;
        micBtn.querySelector("img:first-child").style.display = "none";
        micBtn.querySelector("img.recording").style.display = "none";
        micBtn.querySelector("img.loading").style.display = "inline-block";
    } else {
        vscode.postMessage({ command: "startRecording" });
        isRecording = true;
        micBtn.querySelector("img:first-child").style.display = "none";
        micBtn.querySelector("img.recording").style.display = "inline-block";
        micBtn.querySelector("img.loading").style.display = "none";
        micBtn.classList.add("recording");
    }
}
