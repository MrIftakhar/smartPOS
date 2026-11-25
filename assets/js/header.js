/**
 * @fileoverview Loads the shared smartPOS top bar and handles its actions.
 * @author Md Iftakhar Islam
 */

const headerContainer = document.querySelector("[data-smartpos-header]");
const headerUrl = new URL("../../components/header.html", import.meta.url);
const loginUrl = new URL("../../index.html", import.meta.url);

async function loadHeader(container) {
  try {
    const response = await fetch(headerUrl);

    if (!response.ok) {
      throw new Error(`Could not load ${headerUrl.pathname} (HTTP ${response.status}).`);
    }

    const markup = await response.text();
    const parsedDocument = new DOMParser().parseFromString(markup, "text/html");
    const template = parsedDocument.querySelector("template#smartpos-header-template");

    if (!template) {
      throw new Error("Missing #smartpos-header-template in components/header.html.");
    }

    const content = document.importNode(template.content, true);
    const accountMenu = content.querySelector("#smartpos-account-toggle + .dropdown-menu");

    if (!accountMenu) {
      throw new Error("The Admin button must be followed by its .dropdown-menu.");
    }

    container.replaceChildren(content);
    container.dispatchEvent(new CustomEvent("smartpos:header-ready", {
      bubbles: true
    }));
  } catch (error) {
    console.error("smartPOS header could not load.", error);

    const message = document.createElement("p");
    message.className = "mb-0 p-3 smartpos-text-danger";
    message.setAttribute("role", "alert");
    message.textContent = "The top bar could not load. Check the browser console for details.";

    container.replaceChildren(message);
  }
}

function handleHeaderClick(event) {
  if (!(event.target instanceof Element)) {
    return;
  }

  const sidebarToggle = event.target.closest("[data-smartpos-sidebar-toggle]");

  if (sidebarToggle) {
    sidebarToggle.dispatchEvent(new CustomEvent("smartpos:sidebar-toggle", {
      bubbles: true
    }));
    return;
  }

  const accountPage = event.target.closest("[data-smartpos-account-page]");

  if (accountPage) {
    window.alert(`The ${accountPage.dataset.smartposAccountPage} page is coming later.`);
    return;
  }

  if (event.target.closest("[data-smartpos-logout]")) {
    window.location.assign(loginUrl.href);
  }
}

if (headerContainer) {
  headerContainer.addEventListener("click", handleHeaderClick);
  loadHeader(headerContainer);
}