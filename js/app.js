"use strict";
//(function() {
  var ready, settings, queue; // global state
  window.addEventListener('DOMContentLoaded', function () {
    // show spinner (possibly even earlier than this)
    var getS = loadSettings();
    var getQ = localforage.getItem("queue").then((q) => {
      queue = (q && q.length > 0) ? q : [];
    });
    /*Promise.all([getS, getQ]).then(() => {
      // this is where we ca hide the spinner.
      ready = true;
    });*/
    if (location.search == "?share") {
      document.getElementById("appBody").classList.toggle("displaynone");
      document.getElementById("activity").classList.toggle("displaynone");
    }
    // Buttons & DOM things
    var settingsBtn = document.getElementById("btnSettings");
    settingsBtn.addEventListener("click", function() {
      document.getElementById("settingsForm").classList.remove("fade");
      document.getElementById("settingsForm").classList.toggle("invisible");
      document.getElementById("settingsForm").classList.toggle("displaynone");
    })

    // for manual bookmarking?
    var bookmarkBtn = document.getElementById("btnAdd");
    bookmarkBtn.addEventListener("click", function() {
      var url = document.getElementById("share-url").value;
      API.testConnection(window.settings.hostname).then(() => {
        API.addURL(url).then((result) => {
          var p = document.getElementById("addInfo");
          var url = result['wallabag-url'].length < 20 ? result['wallabag-url'] : prettyURL(result['wallabag-url']);
            p.classList.add("success");
            p.innerHTML = '<i class="fa fa-check"></i> <em>'+url+'</em> saved.';
        }).catch((result) => {
          var p = document.getElementById("addInfo");
          var url = result['wallabag-url'].length < 20 ? result['wallabag-url'] : prettyURL(result['wallabag-url']);
          p.classList.add("error");
          p.innerHTML = '<i class="fa fa-times"></i> <em>'+url+'</em> could not be saved.';
        });
      }).catch(() => {
        alert("no connection :()");
      })
    })
    var saveBtn = document.getElementById("settingsSave");
    saveBtn.addEventListener("click", (ev) => {
      var url = document.getElementById("walla-url").value;
      var test = API.testConnection(url).then(() => {
        settings = { hostname: url};
        return localforage.setItem("settings", settings);
      }).catch((err) => {
        var p = document.getElementById("settingsInfo");
        p.classList.add("error");
        p.innerText = err;
      });
      test.then((settings) => {
        var p = document.getElementById("settingsInfo");
        p.classList.add("success");
        p.innerHTML = '<i class="fa fa-check"></i> Connection verified. Saving';
        document.getElementById("settingsForm").classList.add("invisible", "fade");
        setTimeout(function() {
          document.getElementById("settingsForm").classList.add("displaynone");
        }, 1050)
      }).catch((err) => {
        alert("Could not use IndexedDB to store things. This should not happen.");
        debugger;
        return {};
      });
    });

    var urlInput = document.getElementById("share-url");
    urlInput.addEventListener("input", (ev) => {
      if (!ev.target.checkValidity()) {
        bookmarkBtn.setAttribute("disabled", "true");
      } else {
        bookmarkBtn.removeAttribute("disabled");
      }
    })

});

  function loadSettings(instant) {
    /* returns promise that resolves to settings object
       will prompt if settings are not already stored.
    */
    if ((settings) && ('hostname' in settings)) {
      return Promise.resolve(settings);
    } else if (instant === true) {
      return Promise.resolve(false);
    } else {
      return localforage.getItem("settings").then((s) => {
        if (s == null) {
          return promptForSettings();
        } else {
          settings = s;
          return Promise.resolve(s);
        }
      }).catch((err) => {
        console.warn("Couldnt get settings. Prompting. Error:", err)
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
      document.getElementById("settingsForm").classList.remove("displaynone");
      var saveBtn = document.getElementById("settingsSave");
      saveBtn.addEventListener("click", () => {
        var url = document.getElementById("walla-url").value;
        var test = API.testConnection(url).then(() => {
          resolve(settings); // settings
        }).catch((err) => {
          reject(err);
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
      if (option.name === "share") {
        if (option.data.type == "url") {
          API.addURL(option.data.url).then((result) => {
              var url = result['wallabag-url'].length < 20 ? result['wallabag-url'] : prettyURL(result['wallabag-url']);
              var p = document.getElementById("shareInfo");
              var bigp = document.getElementById("shareStatus");
              //XXX add wallabag logo for easy recognition (since this window fades away)
              bigp.innerHTML = '<i class="fa fa-check"></i>'
              bigp.classList.add("success");
              p.classList.add("success");
              p.innerHTML = '<em>'+url+'</em> saved.';
              setTimeout(function() { window.close(); }, 1000);
            }).catch((result) => {
              var url = result['wallabag-url'].length < 20 ? result['wallabag-url'] : prettyURL(result['wallabag-url']);
              var p = document.getElementById("shareInfo");
              var bigp = document.getElementById("shareStatus");
              //XXX add wallabag logo for easy recognition (since this window fades away)              
              bigp.innerHTML = '<i class="fa fa-times"></i>'
              bigp.classList.add("error");
              p.classList.add("error");
              p.innerHTML = '<em>'+url+'</em> could not be saved.';
              setTimeout(function() { window.close(); }, 1000);
            });
          }
        }
      });
  }
  onmessage = function(e) {
    var expectedOrigin = (new URL(settings.hostname)).origin;
    console.log(e);
    //XXX refactor this, so that all data goes into reject/resolve
    // and the handling happens there!
    if (e.origin === expectedOrigin) {
      var result = e.data;
      if (result['wallabag-url'] in addURLPromises) {
        var [res, rej] = addURLPromises[result['wallabag-url']];
      } else if (result['wallabag-url']+"/" in addURLPromises) {
        var [res, rej] = addURLPromises[result['wallabag-url']+'/'];
      } else {
        var report = {message: "Couldnt find promise for URL",
                      result: result,
                      promiseList: Object.keys(addURLPromises)
      };
        navigator.sendBeacon("http://localhost:8000/", report);
      // yikes, we will keep an unfulfilled promise.
      // sendBeacon would be nice here :<
      }
      if (result['wallabag-status'] === "success") {
        res(result);
      } else {
        rej(result);
      }
    }
  }

  var addURLPromises = {};
  function prettyURL(u) {
    var url = (new URL(u))
    url = url.hostname + '/'+url.pathname+url.search;
    return url.substring(0,20)+"\u2026"; // unicode "...";
  }
//})();
