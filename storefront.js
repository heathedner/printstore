/**
 * Loads assets/storefront-manifest.json (built by scripts/build-storefront-manifest.mjs)
 * and renders a static storefront gallery: main image + optional _alt image per product.
 */
(function () {
  const MANIFEST_URL = "assets/storefront-manifest.json";
  const root = document.getElementById("storefront-root");
  const emptyEl = document.getElementById("storefront-empty");

  if (!root) return;

  function showEmpty(message) {
    root.innerHTML = "";
    root.setAttribute("aria-busy", "false");
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent = message;
    }
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /** Encode path for URL (spaces, etc.) while keeping slashes. */
  function srcUrl(relPath) {
    return relPath
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
  }

  function renderCard(collectionTitle, item) {
    const hasAlt = Boolean(item.alt);
    const altTextMain = `${item.label} — ${collectionTitle}`;
    const altTextAlt = `${item.label} — alternate angle — ${collectionTitle}`;

    const swapBtn = hasAlt
      ? `<button type="button" class="storefront-swap" aria-pressed="false" aria-label="Show alternate photo of ${esc(item.label)}">
          <span aria-hidden="true">⟲</span>
        </button>`
      : "";

    const altImg = hasAlt
      ? `<img class="storefront-img storefront-alt" src="${esc(srcUrl(item.alt))}" alt="${esc(altTextAlt)}" loading="lazy" decoding="async" width="800" height="800">`
      : "";

    return `
      <article class="storefront-card" data-has-alt="${hasAlt}">
        <div class="storefront-media">
          <img class="storefront-img storefront-main" src="${esc(srcUrl(item.main))}" alt="${esc(altTextMain)}" loading="lazy" decoding="async" width="800" height="800">
          ${altImg}
        </div>
        <div class="storefront-card-footer">
          <h4 class="storefront-caption">${esc(item.label)}</h4>
          ${swapBtn}
        </div>
      </article>`;
  }

  function bindSwapHandlers() {
    root.querySelectorAll(".storefront-card[data-has-alt='true']").forEach((card) => {
      const btn = card.querySelector(".storefront-swap");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const on = card.classList.toggle("storefront-card--show-alt");
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
    });
  }

  async function init() {
    root.setAttribute("aria-busy", "true");
    if (emptyEl) emptyEl.hidden = true;

    let data;
    try {
      const res = await fetch(MANIFEST_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(res.statusText);
      data = await res.json();
    } catch (e) {
      showEmpty("Could not load the gallery manifest. Run: node scripts/build-storefront-manifest.mjs");
      return;
    }

    const collections = Array.isArray(data.collections) ? data.collections : [];
    if (collections.length === 0) {
      showEmpty(
        "No collections yet. Add folders under assets/img/storefront/ then run: node scripts/build-storefront-manifest.mjs",
      );
      return;
    }

    const html = collections
      .map((col) => {
        const items = Array.isArray(col.items) ? col.items : [];
        if (items.length === 0) return "";
        const cards = items.map((item) => renderCard(col.title, item)).join("");
        return `
          <section class="storefront-collection" aria-labelledby="storefront-col-${esc(col.id)}">
            <h3 class="storefront-collection-title" id="storefront-col-${esc(col.id)}">${esc(col.title)}</h3>
            <div class="storefront-grid">${cards}</div>
          </section>`;
      })
      .join("");

    root.innerHTML = html || "";
    root.setAttribute("aria-busy", "false");

    if (!root.innerHTML.trim()) {
      showEmpty("Collections exist but contain no paired images yet.");
      return;
    }

    bindSwapHandlers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
