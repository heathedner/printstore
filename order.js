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

    function syncAddressHint() {
      var hintEl = document.getElementById("order-address-hint");
      if (!hintEl) return;
      var p = document.querySelector('input[name="order-local-pickup"]:checked');
      if (!p) {
        hintEl.textContent = "Choose local pickup or shipping above.";
        return;
      }
      if (p.value === "FALSE") {
        hintEl.textContent = "Full shipping address required.";
      } else {
        hintEl.textContent = "Optional for pickup — add details if helpful, or leave blank.";
      }
    }

    document.querySelectorAll('input[name="order-local-pickup"]').forEach(function (el) {
      el.addEventListener("change", syncAddressHint);
    });
    syncAddressHint();

    items.forEach(function (it) {
      const li = document.createElement("li");
      li.className = "order-item-row";

      if (it.thumb) {
        const img = document.createElement("img");
        img.src = it.thumb;
        img.alt = "";
        img.width = 48;
        img.height = 48;
        img.className = "order-item-thumb rounded border flex-shrink-0";
        img.style.objectFit = "cover";
        img.loading = "lazy";
        li.appendChild(img);
      }

      const text = document.createElement("div");
      text.className = "order-item-text";
      const title = document.createElement("div");
      title.className = "order-item-title";
      title.textContent = it.label || it.id;
      const sub = document.createElement("div");
      sub.className = "order-item-meta";
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
      const addressRaw = document.getElementById("order-address")?.value.trim() || "";
      const pickupChecked = document.querySelector('input[name="order-local-pickup"]:checked');
      const localPickup = pickupChecked ? pickupChecked.value : "";
      const notes = document.getElementById("order-notes")?.value.trim() || "";

      if (!name) {
        if (hint) hint.textContent = "Please enter your name.";
        return;
      }
      if (!email) {
        if (hint) hint.textContent = "Please enter your email.";
        return;
      }
      if (!localPickup) {
        if (hint) hint.textContent = "Please choose local pickup or shipping.";
        return;
      }
      if (localPickup === "FALSE" && !addressRaw) {
        if (hint) hint.textContent = "Please enter a shipping address.";
        return;
      }

      var addressOut = addressRaw;
      if (localPickup === "TRUE" && !addressOut) {
        addressOut = "Local pickup";
      }

      const maxAddr = 2000;
      if (addressOut.length > maxAddr) {
        addressOut = addressOut.slice(0, maxAddr) + "\n…[truncated]";
      }

      const lines = formatLines(items);
      if (!lines.trim()) {
        if (hint) hint.textContent = "Your cart appears empty—add items before submitting.";
        return;
      }

      const maxItems = 12000;
      const safeLines =
        lines.length > maxItems ? lines.slice(0, maxItems) + "\r\n…[truncated]" : lines;

      const useGoogle =
        typeof window.PD_googleFormIsConfigured === "function" && window.PD_googleFormIsConfigured();

      if (useGoogle) {
        const payload = {
          name: name,
          email: email,
          address: addressOut,
          localPickup: localPickup,
          items: safeLines,
        };
        if (notes) {
          payload.message = notes;
        }
        window.PD_submitGoogleForm(payload, { target: "_blank" });
        if (hint) {
          hint.textContent =
            "A new tab should open to Google’s confirmation page. If nothing opened, allow pop-ups and try again.";
        }
        return;
      }

      if (!to || to.includes("example.com")) {
        if (hint) hint.textContent = "Set googleForm in config.js or a valid contactEmail for email fallback.";
        return;
      }

      const body =
        "Printed Desert — order request\r\n\r\n" +
        "From: " +
        name +
        "\r\n" +
        "Email: " +
        email +
        "\r\n" +
        "Address:\r\n" +
        addressOut +
        "\r\n" +
        "Local pickup: " +
        (localPickup === "TRUE" ? "Yes" : "No") +
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
