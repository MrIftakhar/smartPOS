/**
 * @fileoverview Handles the smartPOS form component preview.
 * @author Md Iftakhar Islam
 */

const form = document.querySelector("#smartpos-form-preview");
const submitButton = document.querySelector("#smartpos-form-submit");
const status = document.querySelector("#smartpos-form-status");

function clearStatus() {
  status.textContent = "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  status.textContent = "All required fields are valid. This preview does not save data.";
});

form.addEventListener("input", clearStatus);
form.addEventListener("change", clearStatus);
form.addEventListener("reset", clearStatus);

submitButton.disabled = false;