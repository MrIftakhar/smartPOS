/**
 * @fileoverview Sign-in form preview for smartPOS.
 * @author Md Iftakhar Islam
 */

const loginForm = document.querySelector("#login-form");
const passwordInput = document.querySelector("#login-password");
const passwordToggle = document.querySelector("#password-toggle");
const passwordToggleLabel = document.querySelector("#password-toggle-label");
const loginSubmit = document.querySelector("#login-submit");
const loginStatus = document.querySelector("#login-status");

passwordToggle.addEventListener("click", () => {
  const showPassword = passwordInput.type === "password";

  passwordInput.type = showPassword ? "text" : "password";
  passwordToggleLabel.textContent = showPassword ? "Hide" : "Show";
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loginStatus.textContent =
    "Form validated. Sign-in will be available when Laravel is connected.";
});

loginForm.addEventListener("input", () => {
  loginStatus.textContent = "";
});

passwordToggle.hidden = false;
loginSubmit.disabled = false;