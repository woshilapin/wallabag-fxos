/* utils.js
* Utilities for UI things
*/

(function(w) {
  "use strict";
  /// UI
  function spinner(spin) {
    var i = document.getElementById("indicateRefresh");
    if (spin) {
      i.classList.add("fa-spin");
    } else {
      i.classList.remove("fa-spin");
    }
  }

  // UTILS:
  //XXX use addURLPromises as FIFO!!
  function prettyURL(u) {
    if (u.length < 20) {
      return u;
    }
    var url = (new URL(u));
    url = url.hostname + '/' + url.pathname + url.search;
    return url.substring(0, 20) + "\u2026"; // unicode "...";
  }

  w.utils = {
    spinner: spinner,
    prettyURL: prettyURL
  };
})(window);
