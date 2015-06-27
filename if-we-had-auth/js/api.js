var API = {
  testConnection: function testConnection(url, user, pw) {
    /* resolves to settings object
    or rejects with text to display */
    url = url.endsWith(".php") || url.endsWith("/") ? url : url+'/';

    return this.getCSRFToken(url).then((token) => {
      this.login(url, user, pw, token)
    });
    /*



  },
  getCSRFToken: function(url) {
    // get CSRF token -.-
    return new Promise(function(resolve, reject) {
      var suffix = "?login";
      var tokenXHR = new XMLHttpRequest({mozSystem: true});
      tokenXHR.open("GET", url+suffix);
      tokenXHR.send();
      tokenXHR.onload = function(target) {
        debugger;
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
  },
  login: function login(url, user, pw, token) {
    return new Promise(function(resolve, reject) {
      var suffix = "?login";
      var loginRequest = new XMLHttpRequest({mozSystem: true});
      loginRequest.open("POST", url+suffix);
      //"application/x-www-form-urlencoded"
      var postData = 'login=' + user + '&password=' + pw +
                     '&token=' + token;
      loginRequest.send(postData);
      loginRequest.onload = function() {
        debugger;
        // look for cookie
        // look for "<p>welcome to your wallabag</p>"
      }
      loginRequest.onerror = function(e) {
        console.error("token XHR request raised onerror!", e)
        reject("Could not ocnnect to "+url+suffix);
      }
    });
  }
};
