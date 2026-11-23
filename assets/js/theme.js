
/* Спільне перемикання теми AgroNext */
(function () {
  "use strict";

  const root = document.documentElement;
  let saved;

  try {
    saved = localStorage.getItem("agronext-theme");
  } catch (error) {}

  if (saved !== "light" && saved !== "dark") {
    saved = window.matchMedia?.(
      "(prefers-color-scheme: dark)"
    ).matches ? "dark" : "light";
  }

  root.dataset.theme = saved;

  function init() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let toggle = document.getElementById("themeToggle");

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.id = "themeToggle";
      toggle.className = "theme-toggle";

      toggle.innerHTML = `
        <span class="theme-toggle-icon"
              id="themeIcon"
              aria-hidden="true"></span>
        <span class="theme-toggle-text"
              id="themeText"></span>
      `;

      const row =
        header.querySelector(".header-container") ||
        header.querySelector("div");

      const menu = header.querySelector("#menuButton");

      if (menu && menu.parentNode === row) {
        row.insertBefore(toggle, menu);
      } else {
        row?.append(toggle);
      }
    }

    const icon = toggle.querySelector("#themeIcon");
    const label = toggle.querySelector("#themeText");

    function update() {
      const dark = root.dataset.theme === "dark";

      if (icon) icon.textContent = dark ? "☀" : "☾";

      if (label) {
        label.textContent = dark
          ? "Світла тема"
          : "Темна тема";
      }

      toggle.setAttribute("aria-pressed", String(dark));

      toggle.setAttribute(
        "aria-label",
        dark ? "Увімкнути світлу тему" : "Увімкнути темну тему"
      );

      toggle.title = dark
        ? "Увімкнути світлу тему"
        : "Увімкнути темну тему";
    }

    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "dark"
        ? "light"
        : "dark";

      root.dataset.theme = next;

      try {
        localStorage.setItem("agronext-theme", next);
      } catch (error) {}

      update();
    });

    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
