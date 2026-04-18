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
