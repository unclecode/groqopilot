function adjustTextareaHeight(messageInput) {
    messageInput.style.height = "auto";
    messageInput.style.height = `${
        messageInput.scrollHeight - messageInput.clientHeight + messageInput.offsetHeight
    }px`;
}