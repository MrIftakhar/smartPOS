/**
 * @fileoverview Loads the shared sidebar and handles the desktop rail and mobile drawer.
 * @author Md Iftakhar Islam
 */

const sidebarMount = document.querySelector("[data-smartpos-sidebar]");
const sidebarUrl = new URL("../../components/sidebar.html", import.meta.url);
const projectRoot = new URL("../../", import.meta.url);
const desktopViewport = window.matchMedia("(min-width: 992px)");

function markCurrentPage(sidebar) {
  sidebar.querySelectorAll("[data-smartpos-route]").forEach((link) => {
    const pageUrl = new URL(link.getAttribute("href"), projectRoot);
    link.href = pageUrl.href;

    if (pageUrl.pathname !== window.location.pathname) {
      return;
    }

    link.setAttribute("aria-current", "page");

    let group = link.closest("details");

    while (group) {
      group.open = true;
      group = group.parentElement.closest("details");
    }
  });
}

function connectFlyouts(sidebar, isIconRail) {
  const groups = sidebar.querySelectorAll("[data-smartpos-sidebar-flyout]");

  for (const group of groups) {
    const summary = group.querySelector("summary");
    let pointerInside = false;

    group.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") {
        pointerInside = true;

        if (isIconRail()) {
          group.open = true;
        }
      }
    });

    group.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") {
        pointerInside = false;

        if (isIconRail() && !group.contains(document.activeElement)) {
          group.open = false;
        }
      }
    });

    group.addEventListener("focusout", (event) => {
      if (isIconRail() && !pointerInside && !group.contains(event.relatedTarget)) {
        group.open = false;
      }
    });

    group.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isIconRail() && group.open) {
        event.preventDefault();
        summary.focus();
        group.open = false;
      }
    });
  }

  return function closeFlyouts() {
    for (const group of groups) {
      group.open = false;
    }
  };
}

function connectSidebar(sidebar, layout) {
  let drawerOpen = false;
  let drawerTrigger = null;

  function isIconRail() {
    return desktopViewport.matches &&
      layout.classList.contains("smartpos-sidebar-collapsed");
  }

  const closeFlyouts = connectFlyouts(sidebar, isIconRail);

  function syncToggle() {
    const toggle = document.querySelector("[data-smartpos-sidebar-toggle]");

    if (!toggle) {
      return;
    }

    const expanded = desktopViewport.matches ? !isIconRail() : drawerOpen;

    toggle.setAttribute("aria-controls", sidebar.id);
    toggle.setAttribute("aria-expanded", String(expanded));
  }

  document.addEventListener("smartpos:sidebar-toggle", (event) => {
    if (desktopViewport.matches) {
      closeFlyouts();
      layout.classList.toggle("smartpos-sidebar-collapsed");

      if (!isIconRail()) {
        markCurrentPage(sidebar);
      }

      syncToggle();
      return;
    }

    drawerTrigger = event.target;
    window.bootstrap.Offcanvas.getOrCreateInstance(sidebar).toggle(drawerTrigger);
  });

  document.addEventListener("click", (event) => {
    if (isIconRail() && !sidebar.contains(event.target)) {
      closeFlyouts();
    }
  });

  sidebar.addEventListener("shown.bs.offcanvas", () => {
    drawerOpen = true;
    syncToggle();
  });

  sidebar.addEventListener("hidden.bs.offcanvas", () => {
    drawerOpen = false;
    syncToggle();

    if (!desktopViewport.matches) {
      drawerTrigger?.focus();
    }
  });

  document.addEventListener("smartpos:header-ready", syncToggle);

  desktopViewport.addEventListener("change", () => {
    closeFlyouts();

    if (!isIconRail()) {
      markCurrentPage(sidebar);
    }

    syncToggle();
  });

  syncToggle();
}

async function loadSidebar(container) {
  try {
    const response = await fetch(sidebarUrl);

    if (!response.ok) {
      throw new Error(`Sidebar request returned HTTP ${response.status}.`);
    }

    const markup = await response.text();
    const parsedDocument = new DOMParser().parseFromString(markup, "text/html");
    const template = parsedDocument.querySelector("template#smartpos-sidebar-template");

    if (!template) {
      throw new Error("Missing #smartpos-sidebar-template in components/sidebar.html.");
    }

    const content = document.importNode(template.content, true);
    const sidebar = content.querySelector("#smartpos-sidebar");
    const layout = container.closest(".smartpos-dashboard-layout");

    if (!sidebar || !layout) {
      throw new Error("Missing the sidebar element or dashboard layout.");
    }

    markCurrentPage(sidebar);
    container.replaceChildren(content);
    connectSidebar(sidebar, layout);
  } catch (error) {
    console.error("smartPOS sidebar could not load.", error);

    const message = document.createElement("p");
    message.className = "mb-0 p-3 smartpos-text-danger";
    message.setAttribute("role", "alert");
    message.textContent = "Navigation could not load. Check the browser console for details.";
    container.replaceChildren(message);
  }
}

if (sidebarMount) {
  loadSidebar(sidebarMount);
}