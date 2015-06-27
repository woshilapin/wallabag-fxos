"use strict"
(function() {
  window.addEventListener('DOMContentLoaded', function() {
    // show spinner
    var ready = false;
    var settings;
    localForage.get("settings", function(s) {
      settings = s;
      ready = true;
      // hide spinner
    })

    var settingsBtn = document.getElementById("btn-settings");
    settingsBtn.addEventListener("click", function() {
      navigate("settings");
    })

    // for manual bookmarking?
    var bookmarkBtn = document.getElementById("btn-settings");

  }
});

function navigate() {

  document.getElementById("settingsDialog")
}

  navigator.mozSetMessageHandler('activity', function(activityRequest) {
    var option = activityRequest.source;
    if (typeof settings == "undefined") {
      navigate("settings");
    }

    // add to queue of things to Send

    // try to empty the queue.

    if (option.name === "share") {

      // Send back the result
      if (picture) {
        activityRequest.postResult(picture);
      } else {
        activityRequest.postError("Unable to provide a picture");
      }
    }
  });h
})
