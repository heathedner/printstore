(function () {
  const PD = window.PD_CONFIG || {};
  const CONTACT_EMAIL = PD.contactEmail || "";
  const ORDER_KEY = PD.orderStorageKey || "pdDraftOrder";

  function loadCart() {
    try {
      const raw = sessionStorage.getItem(ORDER_KEY);
      const d = raw ? JSON.parse(raw) : [];
      return Array.isArray(d) ? d : [];
    } catch {
      return [];
    }
  }

  function saveCart(c) {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(c));
  }

  var cart = loadCart();

  function readCard(card) {
    const id = card.getAttribute("data-product-id");
    const labelEl = card.querySelector(".storefront-caption");
    const label = labelEl ? labelEl.textContent.trim() : "";
    const details = card.closest("details");
    const colEl = details && details.querySelector(".collection-disclosure-title");
    const collection = colEl ? colEl.textContent.trim() : "";
    const img = card.querySelector(".storefront-main");
    const thumb = img ? img.getAttribute("src") : "";
    return { id: id || "", label: label, collection: collection, thumb: thumb };
  }

  function syncAddButtonStates() {
    const ids = new Set();
    cart.forEach(function (x) {
      ids.add(x.id);
    });
    document.querySelectorAll(".storefront-add").forEach(function (btn) {
      const card = btn.closest(".storefront-card");
      const id = card && card.getAttribute("data-product-id");
      if (!id) return;
      const shortLabel = btn.getAttribute("data-add-label") || "";
      const added = ids.has(id);
      btn.classList.toggle("storefront-add--added", added);
      if (added) {
        btn.setAttribute("aria-label", "Added — " + shortLabel + " (tap to add another)");
      } else {
        btn.setAttribute("aria-label", "Add " + shortLabel + " to order");
      }
    });
  }

  function renderOrderStrip() {
    const thumbs = document.getElementById("order-thumbs");
    const sendBtn = document.getElementById("send-order-btn");
    const clearBtn = document.getElementById("clear-order-btn");
    if (!thumbs || !sendBtn) {
      syncAddButtonStates();
      return;
    }

    thumbs.replaceChildren();

    cart.forEach(function (item) {
      const wrap = document.createElement("span");
      wrap.className = "order-thumb-wrap";
      const img = document.createElement("img");
      img.className = "order-thumb";
      img.src = item.thumb || "";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 56;
      img.height = 56;
      wrap.appendChild(img);
      if (item.qty && item.qty > 1) {
        const badge = document.createElement("span");
        badge.className = "order-thumb-qty";
        badge.textContent = String(item.qty);
        wrap.appendChild(badge);
      }
      thumbs.appendChild(wrap);
    });

    const empty = cart.length === 0;
    sendBtn.disabled = empty;
    sendBtn.setAttribute("aria-disabled", empty ? "true" : "false");
    if (clearBtn) {
      clearBtn.disabled = empty;
      clearBtn.setAttribute("aria-disabled", empty ? "true" : "false");
    }

    syncAddButtonStates();
  }

  function addOrIncrement(item) {
    if (!item.id) return;
    var idx = -1;
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id === item.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) {
      cart[idx].qty = (cart[idx].qty || 1) + 1;
    } else {
      cart.push({
        id: item.id,
        label: item.label,
        collection: item.collection,
        thumb: item.thumb,
        qty: 1,
      });
    }
    saveCart(cart);
    renderOrderStrip();
  }

  document.addEventListener("click", function (e) {
    var addAll = e.target.closest(".collection-add-all");
    if (addAll) {
      e.preventDefault();
      e.stopPropagation();
      var det = addAll.closest("details.collection-disclosure");
      if (!det) return;
      Array.prototype.forEach.call(det.querySelectorAll(".storefront-card"), function (card) {
        var d = readCard(card);
        if (!d.id) return;
        var j = -1;
        for (var k = 0; k < cart.length; k++) {
          if (cart[k].id === d.id) {
            j = k;
            break;
          }
        }
        if (j >= 0) {
          cart[j].qty = (cart[j].qty || 1) + 1;
        } else {
          cart.push({
            id: d.id,
            label: d.label,
            collection: d.collection,
            thumb: d.thumb,
            qty: 1,
          });
        }
      });
      saveCart(cart);
      renderOrderStrip();
      return;
    }

    var addBtn = e.target.closest(".storefront-add");
    if (addBtn) {
      e.preventDefault();
      var card = addBtn.closest(".storefront-card");
      if (!card) return;
      var d = readCard(card);
      if (d.id) addOrIncrement(d);
    }
  });

  var sendBtnInit = document.getElementById("send-order-btn");
  if (sendBtnInit) {
    sendBtnInit.addEventListener("click", function () {
      if (!cart.length) return;
      saveCart(cart);
      window.location.href = "order.html";
    });
  }

  var clearBtnInit = document.getElementById("clear-order-btn");
  if (clearBtnInit) {
    clearBtnInit.addEventListener("click", function () {
      cart = [];
      saveCart(cart);
      renderOrderStrip();
    });
  }

  renderOrderStrip();

  /** Contact form → mailto */
  var form = document.getElementById("contact-form");
  var hint = document.getElementById("form-hint");
  if (form && hint) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hint.textContent = "";

      var name = form.querySelector("#name")?.value.trim() ?? "";
      var replyTo = form.querySelector("#email")?.value.trim() ?? "";
      var subjectLine = form.querySelector("#subject")?.value.trim() ?? "";
      var details = form.querySelector("#details")?.value.trim() ?? "";

      if (!name || !replyTo || !subjectLine || !details) {
        hint.textContent = "Please fill in every field.";
        return;
      }

      if (!CONTACT_EMAIL || CONTACT_EMAIL.includes("example.com")) {
        hint.textContent = "Set contactEmail in config.js.";
        return;
      }

      var body =
        "Name: " +
        name +
        "\r\n" +
        "Reply-to: " +
        replyTo +
        "\r\n\r\n" +
        details +
        "\r\n\r\n" +
        "(Sent from the Printed Desert contact form.)";

      var maxLen = 1800;
      var safeBody = body.length > maxLen ? body.slice(0, maxLen) + "\r\n…[truncated]" : body;

      var href =
        "mailto:" +
        CONTACT_EMAIL +
        "?subject=" +
        encodeURIComponent(subjectLine) +
        "&body=" +
        encodeURIComponent(safeBody);

      window.location.href = href;
      hint.textContent = "If your mail app did not open, check pop-up or default mail settings.";
    });
  }

  /** Search: show/hide cards; collapse empty collections */
  var search = document.getElementById("product-search");
  var collectionsSection = document.getElementById("collections");
  if (search && collectionsSection) {
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
      var parts = tokens(q);
      if (parts.length === 0) return true;
      var hay = normalize(card.getAttribute("data-search-text") || "");
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
      var raw = search.value;
      var parts = tokens(raw);

      if (parts.length === 0) {
        allCards().forEach(function (c) {
          c.classList.remove("pd-search-hidden");
        });
        allDisclosures().forEach(function (d) {
          d.open = true;
        });
        return;
      }

      allCards().forEach(function (card) {
        var ok = cardMatches(card, raw);
        card.classList.toggle("pd-search-hidden", !ok);
      });

      allDisclosures().forEach(function (d) {
        var visible = false;
        Array.prototype.forEach.call(d.querySelectorAll(".storefront-card"), function (c) {
          if (!c.classList.contains("pd-search-hidden")) visible = true;
        });
        d.open = visible;
      });
    }

    search.addEventListener("input", applySearch);
    search.addEventListener("keyup", applySearch);
    search.addEventListener("search", applySearch);
    applySearch();
  }
})();
