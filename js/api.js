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
      /* we do not see close-events on this window, so we patched
         wallabag to send a postMessage to `opener`.

         I could create and return a Promise here, then call the resolve-func
         in onmessage. But I don't like the idea of storing a list of resolve-funcs
         with their purpose somewhere in a global array. How else would I do this?
      */
      //XXX works on desktop, but on Firefox I can't get it to work with opener :<
      window.open(target);
      return;
    })
  }
};
