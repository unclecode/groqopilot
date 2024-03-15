
function setAlert(message, alert_type = "info", timer = -1) {
    const alert = document.querySelector("#topAlert");
    const alertContent = document.querySelector(".alert .content");
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
    const alert = document.querySelector("#topAlert");
    const alertContent = document.querySelector(".alert .content");
    alert.classList.remove("info");
    alert.classList.remove("error");
    alert.classList.remove("warning");
    alert.classList.remove("success");

    alertContent.textContent = "";
    alert.style.display = "none";
}
