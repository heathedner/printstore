/**
 * Submit responses to a public Google Form via POST to .../formResponse.
 * The browser follows Google’s redirect (usually a thank-you HTML page).
 * There is no JSON status code available to JS on a static site (cross-origin).
 */
(function () {
  var PD = window.PD_CONFIG || {};
  var GF = PD.googleForm;

  function formResponseUrl() {
    return "https://docs.google.com/forms/d/e/" + GF.formId + "/formResponse";
  }

  /**
   * @param {object} payload
   * @param {string} payload.name
   * @param {string} payload.email
   * @param {string} payload.items
   * @param {string} [payload.message] optional
   * @param {string} [payload.address] optional (order flow)
   * @param {string} [payload.localPickup] "TRUE" | "FALSE" (order flow; Google choice values)
   * @param {object} [opts]
   * @param {string} [opts.target='_blank'] '_blank' | '_self'
   */
  function submitGoogleForm(payload, opts) {
    opts = opts || {};
    var target = opts.target || "_blank";
    var name = (payload.name || "").trim();
    var email = (payload.email || "").trim();
    var items = (payload.items || "").trim();
    var msg = payload.message != null ? String(payload.message).trim() : "";
    var address = payload.address != null ? String(payload.address).trim() : "";
    var localPickup = (payload.localPickup || "").trim();

    var form = document.createElement("form");
    form.method = "POST";
    form.action = formResponseUrl();
    form.target = target;
    form.setAttribute("accept-charset", "UTF-8");

    function addField(entryKey, value) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = "entry." + entryKey;
      input.value = value;
      form.appendChild(input);
    }

    addField(GF.entryName, name);
    addField(GF.entryEmail, email);
    if (GF.entryAddress) {
      addField(GF.entryAddress, address);
    }
    if (GF.entryLocalPickup && localPickup) {
      addField(GF.entryLocalPickup, localPickup);
    }
    addField(GF.entryItems, items);
    if (msg) {
      addField(GF.entryMessage, msg);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function isConfigured() {
    return !!(GF && GF.formId && GF.entryName && GF.entryEmail && GF.entryItems && GF.entryMessage);
  }

  window.PD_submitGoogleForm = submitGoogleForm;
  window.PD_googleFormIsConfigured = isConfigured;
})();
