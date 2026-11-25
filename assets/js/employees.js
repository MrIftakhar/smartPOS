/**
 * @fileoverview Employee list and add, edit, and remove actions for smartPOS.
 * @author Md Iftakhar Islam
 */

const storageKey = "smartpos.employees";
const employeeStatus = document.querySelector("#employee-status");
const employeeRows = document.querySelector("#employee-rows");
const employeeForm = document.querySelector("#employee-form");

function showStatus(message, isError = false) {
  employeeStatus.textContent = message;
  employeeStatus.classList.toggle("smartpos-text-danger", isError);
  employeeStatus.classList.toggle("smartpos-text-success", !isError);
  employeeStatus.hidden = false;
}

function readEmployees() {
  const employees = JSON.parse(localStorage.getItem(storageKey) ?? "[]");

  if (
    !Array.isArray(employees) ||
    employees.some((employee) => (
      !employee ||
      typeof employee.name !== "string" ||
      typeof employee.email !== "string"
    ))
  ) {
    throw new Error("Invalid employee list.");
  }

  return employees;
}

function saveEmployees(employees) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(employees));
    return true;
  } catch {
    showStatus("The employee changes could not be saved in this browser.", true);
    return false;
  }
}

function connectEmployeeList(initialEmployees) {
  const addButton = document.querySelector("#employee-add");
  const editButton = document.querySelector("#employee-edit");
  const editDetailsButton = document.querySelector("#employee-edit-details");
  const removeButton = document.querySelector("#employee-remove-selected");
  const selectHeading = document.querySelector("#employee-select-heading");
  const count = document.querySelector("#employee-count");

  let employees = initialEmployees;
  let managing = false;

  function selectedEmail() {
    return employeeRows.querySelector("input:checked")?.value;
  }

  function syncActions() {
    const hasSelection = Boolean(selectedEmail());

    editButton.disabled = employees.length === 0;
    editButton.textContent = managing ? "Done" : "Edit Employee";
    editButton.setAttribute("aria-expanded", String(managing));

    editDetailsButton.hidden = !managing;
    editDetailsButton.disabled = !managing || !hasSelection;
    removeButton.hidden = !managing;
    removeButton.disabled = !managing || !hasSelection;
  }

  function renderList() {
    employeeRows.replaceChildren();
    selectHeading.hidden = !managing;

    count.textContent = `${employees.length} ${
      employees.length === 1 ? "employee" : "employees"
    }`;

    if (employees.length === 0) {
      const cell = employeeRows.insertRow().insertCell();
      cell.colSpan = 3;
      cell.className = "smartpos-table-empty text-center py-4";
      cell.textContent = "No employees added yet.";
    }

    for (const employee of employees) {
      const row = employeeRows.insertRow();

      if (managing) {
        const selectCell = row.insertCell();
        const select = document.createElement("input");

        select.type = "radio";
        select.name = "selected-employee";
        select.value = employee.email;
        select.className = "form-check-input";
        select.setAttribute("aria-label", `Select ${employee.name} (${employee.email})`);

        selectCell.append(select);
      }

      const nameCell = document.createElement("th");
      nameCell.scope = "row";
      nameCell.textContent = employee.name;
      row.append(nameCell);

      row.insertCell().textContent = employee.shift || "—";

      const dateCell = row.insertCell();
      dateCell.className = "text-nowrap smartpos-text-numeric";

      if (employee.joiningDate) {
        const joiningDate = document.createElement("time");
        joiningDate.dateTime = employee.joiningDate;
        joiningDate.textContent = employee.joiningDate;
        dateCell.append(joiningDate);
      } else {
        dateCell.textContent = "—";
      }
    }

    syncActions();
  }

  editButton.addEventListener("click", () => {
    managing = !managing;
    renderList();

    if (managing) {
      employeeRows.querySelector("input")?.focus();
    }
  });

  employeeRows.addEventListener("change", syncActions);

  editDetailsButton.addEventListener("click", () => {
    const email = selectedEmail();

    if (!email) {
      return;
    }

    const editUrl = new URL("./manage.html", window.location.href);
    editUrl.searchParams.set("employee", email);
    window.location.assign(editUrl.href);
  });

  removeButton.addEventListener("click", () => {
    const email = selectedEmail();
    const employee = employees.find((person) => person.email === email);

    if (!employee || !window.confirm(`Remove ${employee.name} from the employee list?`)) {
      return;
    }

    try {
      const currentEmployees = readEmployees();
      const updatedList = currentEmployees.filter((person) => person.email !== email);

      if (!saveEmployees(updatedList)) {
        return;
      }

      employees = updatedList;
      managing = employees.length > 0;
      renderList();
      showStatus(`${employee.name} was removed.`);

      if (managing) {
        employeeRows.querySelector("input")?.focus();
      } else {
        addButton.focus();
      }
    } catch {
      showStatus("The employee list could not be loaded in this browser.", true);
    }
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) {
      return;
    }

    try {
      employees = readEmployees();
      managing = false;
      renderList();
    } catch {
      showStatus("The employee list could not be loaded in this browser.", true);
    }
  });

  renderList();
}

function connectEmployeeForm(employees) {
  const fields = employeeForm.elements;
  const submitButton = document.querySelector("#employee-submit");
  const removeButton = document.querySelector("#employee-remove");
  const selectedEmail = new URLSearchParams(window.location.search).get("employee");
  const isEditing = selectedEmail !== null;
  const employee = employees.find((person) => person.email === selectedEmail);

  if (isEditing && !employee) {
    showStatus("This employee could not be found. Return to the Employee List.", true);
    return;
  }

  if (isEditing) {
    document.title = "Edit Employee | smartPOS";
    document.querySelector("#employee-page-title").textContent = "Edit Employee";

    fields.namedItem("name").value = employee.name;
    fields.namedItem("email").value = employee.email;
    fields.namedItem("phone").value = employee.phone ?? "";
    fields.namedItem("role").value = employee.role ?? "";
    fields.namedItem("shift").value = employee.shift ?? "";
    fields.namedItem("joiningDate").value = employee.joiningDate ?? "";

    removeButton.hidden = false;
  }

  submitButton.disabled = false;

  employeeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(employeeForm);
    const updatedEmployee = {
      ...employee,
      name: data.get("name").trim(),
      email: data.get("email").trim().toLowerCase(),
      phone: data.get("phone").trim(),
      role: data.get("role"),
      shift: data.get("shift"),
      joiningDate: data.get("joiningDate")
    };

    if (!updatedEmployee.name) {
      showStatus("Enter the employee's full name.", true);
      fields.namedItem("name").focus();
      return;
    }

    try {
      const currentEmployees = readEmployees();

      if (isEditing && !currentEmployees.some((person) => person.email === selectedEmail)) {
        showStatus("This employee has already been removed.", true);
        return;
      }

      const emailExists = currentEmployees.some((person) => (
        person.email === updatedEmployee.email && person.email !== selectedEmail
      ));

      if (emailExists) {
        showStatus("An employee with this email address already exists.", true);
        fields.namedItem("email").focus();
        return;
      }

      const updatedList = isEditing
        ? currentEmployees.map((person) => (
            person.email === selectedEmail ? updatedEmployee : person
          ))
        : [...currentEmployees, updatedEmployee];

      if (saveEmployees(updatedList)) {
        window.location.assign("./index.html");
      }
    } catch {
      showStatus("The employee list could not be loaded in this browser.", true);
    }
  });

  removeButton.addEventListener("click", () => {
    if (!employee || !window.confirm(`Remove ${employee.name} from the employee list?`)) {
      return;
    }

    try {
      const updatedList = readEmployees().filter((person) => person.email !== selectedEmail);

      if (saveEmployees(updatedList)) {
        window.location.assign("./index.html");
      }
    } catch {
      showStatus("The employee list could not be loaded in this browser.", true);
    }
  });
}

try {
  const employees = readEmployees();

  if (employeeRows) {
    connectEmployeeList(employees);
  }

  if (employeeForm) {
    connectEmployeeForm(employees);
  }
} catch {
  showStatus("The saved employee list could not be loaded in this browser.", true);

  if (employeeRows) {
    employeeRows.rows[0].cells[0].textContent = "Employee list unavailable.";
  }
}