var API = {
  testConnection: function testConnection(url) {
    /* resolves to settings object
    or rejects with text to display */
    url = url.endsWith(".php") || url.endsWith("/") ? url : url+'/';

    return this.checkWallabag(url).then((token) => {
      return Promise.resolve(true);
    });
  },
  /*getCSRFToken: function(url) {
    // get CSRF token -.-
    return new Promise(function(resolve, reject) {
      var suffix = "?login";
      var tokenXHR = new XMLHttpRequest({mozSystem: true});
      tokenXHR.open("GET", url+suffix);
      tokenXHR.send();
      tokenXHR.onload = function(target) {
        var match = tokenXHR.response.match(/name="token" value="([a-z0-9]+)"/);
        if (match) {
          resolve(match[1]);
        } else {
          reject("Couldn't find login form at "+url+suffix);
        }
      }
      tokenXHR.onerror = function(e) {
        console.error("token XHR request raised onerror!", e)
        reject("Could not ocnnect to "+url+suffix);
      }
    });
  },*/
  checkWallabag: function checkWallabag(url) {
    return new Promise(function(resolve, reject) {
      var i = document.createElement("img");
      url = url.endsWith(".php") || url.endsWith("/") ? url : url+'/';
      i.src = url+'themes/default/img/logo.svg';
      i.onload = function() {
        resolve(true);
        document.body.removeChild(i);
      }
      i.onerror = function() {
        reject(false);
        document.body.removeChild(i);
       }
      i.classList.add("testImage");
      document.body.appendChild(i);
    })
  },
  addURL: function(url) {
    // should always test connection before adding?
    loadSettings().then((s) => {
      var target = s['hostname'];
      target = target.endsWith(".php") || target.endsWith("/") ? target : target+'/';
      target = target+"?action=add&autoclose=true&url="+
            encodeURIComponent(btoa(url));
      // we do not see close-events on this window :<
      window.open(target);
    })
  }
};
