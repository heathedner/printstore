/**
 * Set this to the address where you want print requests to land.
 * GitHub Pages has no server; this opens the visitor's mail client (mailto:).
 */
const CONTACT_EMAIL = "sales@printeddesert.com";

(function () {
  const form = document.getElementById("contact-form");
  const hint = document.getElementById("form-hint");
  if (!form || !hint) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hint.textContent = "";

    const name = form.querySelector("#name")?.value.trim() ?? "";
    const replyTo = form.querySelector("#email")?.value.trim() ?? "";
    const subjectLine = form.querySelector("#subject")?.value.trim() ?? "";
    const details = form.querySelector("#details")?.value.trim() ?? "";

    if (!name || !replyTo || !subjectLine || !details) {
      hint.textContent = "Please fill in every field.";
      return;
    }

    if (!CONTACT_EMAIL || CONTACT_EMAIL.includes("example.com")) {
      hint.textContent =
        "Set CONTACT_EMAIL in main.js to your real address before publishing.";
      return;
    }

    const body =
      `Name: ${name}\r\n` +
      `Reply-to: ${replyTo}\r\n\r\n` +
      `${details}\r\n\r\n` +
      `(Sent from the Printed Desert contact form.)`;

    const maxLen = 1800;
    const safeBody = body.length > maxLen ? body.slice(0, maxLen) + "\r\n…[truncated]" : body;

    const href =
      "mailto:" +
      CONTACT_EMAIL +
      "?subject=" +
      encodeURIComponent(subjectLine) +
      "&body=" +
      encodeURIComponent(safeBody);

    window.location.href = href;
    hint.textContent = "If your mail app did not open, check pop-up or default mail settings.";
  });
})();

/** Gallery cards: toggle alternate photo (static HTML). */
(function () {
  document.querySelectorAll(".storefront-swap").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const card = btn.closest(".storefront-card");
      if (!card) return;
      const on = card.classList.toggle("storefront-card--show-alt");
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
  });
})();

/** Search products across collections; collapse <details> with no visible matches. */
(function () {
  const search = document.getElementById("product-search");
  const collectionsSection = document.getElementById("collections");
  if (!search || !collectionsSection) return;

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  }

  function tokens(q) {
    return normalize(q)
      .split(/\s+/)
      .map(function (t) {
        return t.replace(/[^a-z0-9_-]+/gi, "");
      })
      .filter(Boolean);
  }

  function cardMatches(card, q) {
    const parts = tokens(q);
    if (parts.length === 0) return true;
    const hay = normalize(card.getAttribute("data-search-text") || "");
    return parts.every(function (p) {
      return hay.includes(p);
    });
  }

  function allCards() {
    return Array.prototype.slice.call(collectionsSection.querySelectorAll(".storefront-card"));
  }

  function allDisclosures() {
    return Array.prototype.slice.call(collectionsSection.querySelectorAll("details.collection-disclosure"));
  }

  function applySearch() {
    const raw = search.value;
    const parts = tokens(raw);

    if (parts.length === 0) {
      allCards().forEach(function (c) {
        c.removeAttribute("hidden");
      });
      allDisclosures().forEach(function (d) {
        d.open = true;
      });
      return;
    }

    allCards().forEach(function (card) {
      const ok = cardMatches(card, raw);
      if (ok) card.removeAttribute("hidden");
      else card.setAttribute("hidden", "");
    });

    allDisclosures().forEach(function (d) {
      var visible = false;
      Array.prototype.forEach.call(d.querySelectorAll(".storefront-card"), function (c) {
        if (!c.hasAttribute("hidden")) visible = true;
      });
      d.open = visible;
    });
  }

  search.addEventListener("input", applySearch);
  search.addEventListener("search", applySearch);
})();
