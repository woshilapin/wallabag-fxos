(function (w) {
  'use strict'
  var API = {
    testConnection: function testConnection(url) {
      /* resolves to settings object
      or rejects with text to display */
      url = url.endsWith('.php') || url.endsWith('/') ? url : url + '/';
      return this.checkWallabag(url).then(() => {
        return Promise.resolve(true);
      });
    },
    checkWallabag: function checkWallabag(url) {
      return new Promise(function (resolve, reject) {
        var i = document.createElement('img');
        url = url.endsWith('.php') || url.endsWith('/') ? url : url + '/';
        i.src = url + 'themes/default/img/logo.svg';
        i.onload = function () {
          resolve(true);
          document.body.removeChild(i);
        }
        i.onerror = function () {
          reject(false);
          document.body.removeChild(i);
        }
        i.classList.add('testImage');
        document.body.appendChild(i);
      })
    },
    addURL: function (wallahost, url) {
      // should always test connection before adding?
      var target = wallahost;
      target = target.endsWith('.php') || target.endsWith('/') ? target : target + '/';
      target = target + '?action=add&autoclose=true&url=' +
      encodeURIComponent(btoa(url));
      /* we do not see close-events on this window, so we patched
      wallabag to send a postMessage to `opener`.

      I could create and return a Promise here, then call the resolve-func
      in onmessage. But I don't like the idea of storing a list of resolve-funcs
      with their purpose somewhere in a global array. How else would I do this?
      */
      //XXX works on desktop, but on Firefox I can't get it to work with opener :<
      window.open(target);
      return new Promise(function (res, rej) {
        var u = new URL(url); // normalize URL
        window.addURLPromises[u.href] = [
          res,
          rej
        ];
      });
    },
    getAllFeeds: function (baseUrl, token, userid) {
      var promises = [
      ];
      for (var type of ['home', 'fav', 'archive']) {
        promises.push(this.getFeed(baseUrl, type, token, userid));
      }
      return Promise.all(promises);
    },
    getFeed: function (baseUrl, type, token, userid) {
      return new Promise(function (resolve, reject) {
        var TYPES = [
          'home',
          'fav',
          'archive'
        ];
        if (TYPES.indexOf(type) === - 1) {
          reject('Feed Type not known')
        }
        var url = baseUrl + '?feed&type=' + type + '&user_id=' + userid + '&token=' + encodeURIComponent(token);
        var xhr = new XMLHttpRequest({
          mozSystem: true
        });
        xhr.responseType = 'xml';
        xhr.open('GET', url);
        xhr.onload = (function (e) {
          var r = API.MyXmlToJson(type, xhr.responseXML)
          resolve(r);
        }).bind(this);
        xhr.onerror = function (e) {
          reject('XHR Error', e);
        }
        xhr.send();
      })
    },
    MyXmlToJson: function MyXmlToJson(type, xml) {
      // turns the horrible "json-xml" into something readable
      var feed = API.xmlToJson(xml);
      var r = {
        fetched: feed.rss.channel.pubDate['#text'],
        items: [
        ],
        type: type
      };
      if ('item' in feed.rss.channel) {
        if (feed.rss.channel.item.length) { // list of items
          for (var item of feed.rss.channel.item) {
            r.items.push({
              text: item.description['#text'],
              source: item.link['#text'],
              title: item.title['#text'],
              wallabaguri: item.source['@attributes'].url,
              wallabguid: item.source['@attributes'].url.match(/&id=(\d+)/) [1]
            })
          }
        } else { // one single item of this type
          var item = feed.rss.channel.item;
          r.items.push({
            text: item.description['#text'],
            source: item.link['#text'],
            title: item.title['#text'],
            wallabaguri: item.source['@attributes'].url,
            wallabguid: item.source['@attributes'].url.match(/&id=(\d+)/) [1]
          })
        }
      } else {
        r.items = [];
      }
      return r;
    },
    xmlToJson: function xmlToJson(xml) {
      // thx http://davidwalsh.name/convert-xml-json
      //XXX rewrite this funciton to return what MyXmlToJson does & combine them.
      var obj = {
      };
      if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
          obj['@attributes'] = {
          };
          for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
          }
        }
      } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
      }
      // do children

      if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
          var item = xml.childNodes.item(i);
          var nodeName = item.nodeName;
          if (typeof (obj[nodeName]) == 'undefined') {
            obj[nodeName] = xmlToJson(item);
          } else {
            if (typeof (obj[nodeName].push) == 'undefined') {
              var old = obj[nodeName];
              obj[nodeName] = [
              ];
              obj[nodeName].push(old);
            }
            obj[nodeName].push(xmlToJson(item));
          }
        }
      }
      return obj;
    }
  };
  w.API = API;
})(window)
