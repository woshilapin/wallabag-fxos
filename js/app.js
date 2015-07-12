/* globals API, utils, localforage */
(function() {
  "use strict";
  var addURLPromises = {};
    function loadSettings(instant) {
      /* returns promise that resolves to settings object
      will prompt if settings are not already stored.
      */
      if ((window.settings) && ('hostname' in window.settings)) {
        return Promise.resolve(window.settings);
      } else if (instant === true) {
        return Promise.resolve(false);
      } else {
        return localforage.getItem("settings").then((s) => {
          if (s == null) {
            return promptForSettings();
          } else {
            window.settings = s;
            return Promise.resolve(s);
          }
        }).catch((err) => {
          console.warn("Couldnt get settings. Prompting. Error:", err);
          return promptForSettings();
        });
      }
    }
    function promptForSettings() {
      /* returns promise that resovles to settings object.
      shows settings dialog and asks for
      */
      var deckbox = document.getElementById("deckbox");
      deckbox.showCard(0);
      // synthesize promise to be resolved when user clicks on "save" button.
      return new Promise(function(resolve, reject) {
        var saveBtn = document.getElementById("settingsSave");
        saveBtn.addEventListener("click", () => {
          var url = document.getElementById("walla-url").value;
          API.testConnection(url).then(() => {
            resolve({ hostname: url }); // settings
          }).catch((err) => {
            reject(err);
          });
        });
      });
    };

    function displayFeeds(feeds) {
      for (var f of feeds) {
        var type;
        switch(f.type) {
          case 'home':
            type = 'unread';
            break;
          case 'fav':
            type = 'favorites';
            break;
          case 'archive':
            type = 'archived';
            break;
        }
        var begin = Sanitizer.escapeHTML`<header>${type} (${f.items.length})</header><ul>`;
        var items = '';
        var end = `</ul>`;
        for (var item of f.items) {
          var title = item.title === "Untitled" ? utils.prettyURL(item.source) : item.title;
          items += Sanitizer.escapeHTML`<li>
            <a href="${item.source}" data-wallabag-uid="${item.wallabguid}"
               target="_blank"><p>${title}</p><p>`;
          if (item.source.indexOf("https") !== -1) {
            items += `<i class="fa fa-lock"></i>&nbsp;`;
          }
          items += Sanitizer.escapeHTML`${utils.prettyURL(item.source)}</p>
            </a></li>`;
        }
        if (f.items.length == 0) {
          items = `<div class="empty">No items in your list</div>`;
        }
        var template = begin + items + end;
        var list = document.getElementById("list-"+f.type);
        list.innerHTML = template;
        localforage.setItem("html-cache-"+f.type, template);
      }
  };
  window.addEventListener('WebComponentsReady', function () {
    loadSettings().then((settings) => {
      if (location.search === "?share") {
        return;
      }
      console.log("Trying to get all feeds right away..")
      if ('token' in settings) {
        var t = document.getElementById('walla-token');
        t.value = settings.token;
      }
      if ('userid' in settings) {
        var uid = document.getElementById('walla-uid');
        uid.value = settings.userid;
      }
      if ('hostname' in settings) {
        var url = document.getElementById('walla-url');
        url.value = settings.hostname;
      }
      if (('token' in settings) && ('userid' in settings) && ('hostname' in settings)) {
        API.getAllFeeds(settings.hostname, settings.token, settings.userid).then((feeds) => {
          utils.spinner(false);
          displayFeeds(feeds);
        }).catch(() => {
          console.log("Couldnt get feeds. Restoring from cache.")
          for (var type of['home', 'fav', 'archive']) {
            localforage.getItem("html-cache-"+type).then((c) => {
              var list = document.getElementById("list-"+type);
              list.innerHTML = c;
            });
          }
        });
      } else {
        console.log("Token is not known... We can disable most of the UI");
        // Disable UI
        for (var type of['home', 'fav', 'archive']) {
          var list = document.getElementById("list-"+type);
          list.innerHTML = `<div class="empty">
            Can not fetch lists without user id and token.</div>`;
        }
      }
    });
    if (location.search === "?share") {
      document.getElementById("appBody").classList.toggle("displaynone");
      document.getElementById("activity").classList.toggle("displaynone");
    }
    // Buttons & DOM things
    var btnRefresh = document.getElementById("btnRefresh");
    btnRefresh.addEventListener("click", function() {
      utils.spinner(true);
      loadSettings().then((settings) => {
        API.getAllFeeds(settings.hostname, settings.token, settings.userid).then((feeds) => {
          utils.spinner(false);
          displayFeeds(feeds);
        });
      });
    });
    var btnSettings = document.getElementById("btnSettings");
    btnSettings.addEventListener("click", function() {
      var deckbox = document.getElementById("deckbox");
      deckbox.showCard(0);
      // make tabbar forget what's been active previously
      var tabIcons = document.getElementsByTagName("brick-tabbar-tab");
      for (var i in tabIcons) {
        tabIcons[i].removeAttribute("selected");
        // #10: remember which one to go back to when clicking again.
      }
      tabbar.querySelector("div.selected-indicator").style = "";
    });
    // for manual bookmarking
    var btnAdd = document.getElementById("btnAdd");
    btnAdd.addEventListener("click", function() {
      var url = document.getElementById("share-url").value;
      loadSettings.then((settings) => {
        API.addURL(settings.hostname, url).then((result) => {
          var p = document.getElementById("addInfo");
          var purl = utils.prettyURL(result['wallabag-url']);
          p.classList.add("success");
          p.innerHTML = '<i class="fa fa-check"></i> <em>' + purl + '</em> saved.';
        }).catch((result) => {
          var p = document.getElementById("addInfo");
          var purl = utils.prettyURL(result['wallabag-url']);
          p.classList.add("error");
          p.innerHTML = '<i class="fa fa-times"></i> <em>' + purl + '</em> could not be saved.';
        });
      }).catch(() => {
        alert("no connection :()");
      });
    });
    var saveBtn = document.getElementById("settingsSave");
    saveBtn.addEventListener("click", () => {
      var url = document.getElementById("walla-url").value;
      var uid = document.getElementById("walla-uid").value;
      var token = document.getElementById("walla-token").value;
      var test;
      if (url && uid && token) {
        var test = API.getFeed(url, 'home', token, uid);
      } else if (url) {
        var test = API.testConnection(url);
      } else { // nothing? really?
        return;
      }
      test.then(() => {
        var settings = { hostname: url,
                     userid: uid,
                     token: token };
        return localforage.setItem("settings", settings);
      }).catch((err) => {
        var p = document.getElementById("settingsInfo");
        p.classList.add("error");
        p.innerText = err;
      });
      test.then(() => {
        var p = document.getElementById("settingsInfo");
        p.classList.add("success");
        p.innerHTML = '<i class="fa fa-check"></i> Connection verified.';
      }).catch(() => {
        alert("Could not use IndexedDB to store things. This should not happen.");
        return {};
      });
    });

    var urlInput = document.getElementById("share-url");
    urlInput.addEventListener("input", (ev) => {
      if (!ev.target.checkValidity()) {
        btnAdd.setAttribute("disabled", "true");
      } else {
        btnAdd.removeAttribute("disabled");
      }
    });
  });
  // Handlers:
  if ('mozSetMessageHandler' in navigator) {
    navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
      console.log("alarm fired: " + JSON.stringify(mozAlarm.data));
    });
    navigator.mozSetMessageHandler('activity', function(activityRequest) {
      var option = activityRequest.source;
      if (option.name === "share") {
        if (option.data.type === "url") {
          loadSettings().then((settings) => {
            API.addURL(settings.hostname, option.data.url).then((result) => {
              var url = utils.prettyURL(result['wallabag-url']);
              var p = document.getElementById("shareInfo");
              var bigp = document.getElementById("shareStatus");
              //XXX add wallabag logo for easy recognition (since this window fades away)
              bigp.innerHTML = '<i class="fa fa-check"></i>';
              bigp.classList.add("success");
              p.classList.add("success");
              p.innerHTML = '<em>' + url + '</em> saved.';
              setTimeout(function() { window.close(); }, 1000);
            }).catch((result) => {
              var url = utils.prettyURL(result['wallabag-url']);
              var p = document.getElementById("shareInfo");
              var bigp = document.getElementById("shareStatus");
              //XXX add wallabag logo for easy recognition (since this window fades away)
              bigp.innerHTML = '<i class="fa fa-times"></i>';
              bigp.classList.add("error");
              p.classList.add("error");
              p.innerHTML = '<em>' + url + '</em> could not be saved.';
              setTimeout(function() { window.close(); }, 1000);
            });
          });
        }
      }
    });
  }
  window.onmessage = function(e) {
    loadSettings().then((settings) => {
      var expectedOrigin = (new URL(settings.hostname)).origin;
      //XXX refactor this, so that all data goes into reject/resolve
      // and the handling happens there!
      if (e.origin === expectedOrigin) {
        var result = e.data;
        var url = new URL(result['wallabag-url']).href; // normaliezd
        if (url in addURLPromises) {
          var [res, rej] = addURLPromises[url];
        } else {
          var report = { message: "Couldnt find promise for URL",
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
    });
  };


  window.addURLPromises = addURLPromises;
  window.loadSettings = loadSettings;
})(window);
