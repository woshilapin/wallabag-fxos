"use strict";
//(function() {
  var ready, settings, queue; // global state
  window.addEventListener('DOMContentLoaded', function () {
    // show spinner (possibly even earlier than this)
    var getS = loadSettings();
    var getQ = localforage.getItem("queue").then((q) => {
      queue = (q && q.length > 0) ? q : [];
    });
    Promise.all(getS, getQ).then(() => {
      // this is where we ca hide the spinner.
      ready = true;
    });

    // Buttons & DOM things
    var settingsBtn = document.getElementById("btn-settings");
    settingsBtn.addEventListener("click", function() {
      document.getElementById("settingsForm").classList.toggle("invisible");
    })

    // for manual bookmarking?
    var bookmarkBtn = document.getElementById("btn-settings");

    //XXX need to remember to store stuff with localforage.set

});

  function loadSettings() {
    /* returns promise that resolves to settings object
       will prompt if settings are not already stored.
    */
    if ((settings) && ('username' in settings)) {
      return Promise.resolve(settings);
    } else {
      return localforage.getItem("settings").then((s) => {
        if (s == null) {
          return promptForSettings(res, rej)
        }
      }).catch((err) => {
        console.warn("Couldnt get settings. Prompting")
        return promptForSettings()
      });
    }
  }
  function promptForSettings() {
    /* returns promise that resovles to settings object.
      shows settings dialog and asks for
    */

    // synthesize promise to be resolved when user clicks on "save" button.
    return new Promise(function(resolve, reject) {
      document.getElementById("settingsForm").classList.remove("invisible");
      var saveBtn = document.getElementById("settingsSave");
      saveBtn.addEventListener("click", () => {
        var url = document.getElementById("walla-url").value;
        var user = document.getElementById("walla-user").value;
        var pw = document.getElementById("walla-pw").value;
        var test = API.testConnection(url, user, pw).then(() => {
          return localforage.set("settings", {
                  hostname: hostname,
                  username: username,
                  password: password });
        }).catch((err) => {
          var p = document.getElementById("settingsDemand");
          p.classList.add("error");
          p.innerText = err;
          reject(err);
        });
        test.then((settings) => {
          resolve(settings); // settings
        }).catch((err) => {
          alert("Could not use IndexedDB to store things. This should not happen.");
          debugger;
          return {};
        });
      });
    });
  }



  // Handlers:
  if ('mozSetMessageHandler' in navigator) {
    navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
      debugger;
      console.log("alarm fired: " + JSON.stringify(mozAlarm.data));
    });
    navigator.mozSetMessageHandler('activity', function(activityRequest) {
      var option = activityRequest.source;


      // add to queue of things to Send

      // try to empty the queue.

      // example-activity handler from MDN
      if (option.name === "share") {
        // Send back the result
        if (picture) {
          activityRequest.postResult(picture);
        } else {
          activityRequest.postError("Unable to provide a picture");
        }
      }
    });
  }

//})();
