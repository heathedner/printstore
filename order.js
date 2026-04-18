(function () {
  const cfg = window.PD_CONFIG || {};
  const STORAGE_KEY = cfg.orderStorageKey || "pdDraftOrder";
  const to = cfg.contactEmail || "";

  const emptyEl = document.getElementById("order-empty");
  const form = document.getElementById("order-form");
  const listEl = document.getElementById("order-items-list");
  const hint = document.getElementById("order-hint");

  function readCart() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function formatLines(items) {
    return items
      .map(function (it, i) {
        const q = it.qty && it.qty > 1 ? " ×" + it.qty : "";
        return i + 1 + ". " + (it.collection || "") + " — " + (it.label || it.id) + q;
      })
      .join("\r\n");
  }

  function init() {
    const items = readCart();

    if (items.length === 0) {
      if (emptyEl) emptyEl.classList.remove("d-none");
      return;
    }

    if (emptyEl) emptyEl.classList.add("d-none");
    if (form) form.classList.remove("d-none");

    if (!listEl || !form) return;

    items.forEach(function (it) {
      const li = document.createElement("li");
      li.className = "list-group-item d-flex align-items-center gap-3";

      if (it.thumb) {
        const img = document.createElement("img");
        img.src = it.thumb;
        img.alt = "";
        img.width = 48;
        img.height = 48;
        img.className = "rounded border flex-shrink-0";
        img.style.objectFit = "cover";
        img.loading = "lazy";
        li.appendChild(img);
      }

      const text = document.createElement("div");
      text.className = "flex-grow-1 min-w-0";
      const title = document.createElement("div");
      title.className = "fw-semibold";
      title.textContent = it.label || it.id;
      const sub = document.createElement("div");
      sub.className = "small text-muted";
      const qty = it.qty && it.qty > 1 ? " ×" + it.qty : "";
      sub.textContent = (it.collection || "") + qty;
      text.appendChild(title);
      text.appendChild(sub);
      li.appendChild(text);
      listEl.appendChild(li);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (hint) hint.textContent = "";

      const name = document.getElementById("order-name")?.value.trim() || "";
      const email = document.getElementById("order-email")?.value.trim() || "";
      const notes = document.getElementById("order-notes")?.value.trim() || "";

      if (!name || !email) {
        if (hint) hint.textContent = "Please enter your name and email.";
        return;
      }

      if (!to || to.includes("example.com")) {
        if (hint) hint.textContent = "Set contactEmail in config.js.";
        return;
      }

      const lines = formatLines(items);
      const body =
        "Printed Desert — order request\r\n\r\n" +
        "From: " +
        name +
        "\r\n" +
        "Email: " +
        email +
        "\r\n\r\n" +
        "Items:\r\n" +
        lines +
        "\r\n\r\n" +
        "Notes:\r\n" +
        (notes || "(none)") +
        "\r\n\r\n" +
        "(Draft from printeddesert.com order page.)";

      const maxLen = 2000;
      const safeBody = body.length > maxLen ? body.slice(0, maxLen) + "\r\n…[truncated for email length]" : body;

      const href =
        "mailto:" +
        to +
        "?subject=" +
        encodeURIComponent("Printed Desert order") +
        "&body=" +
        encodeURIComponent(safeBody);

      window.location.href = href;
      if (hint) hint.textContent = "If your mail app did not open, check pop-ups or your default mail client.";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
