(function(global) {

  'use strict';

  var utils = global.HTTPClient.utils;

  var formatQuery = function(query, sep, eq) {
    //separator character
    sep = sep || '&';
    //assignement character
    eq = eq || '=';

    var querystring = '';
    if (typeof query === 'object') {
      for (var i in query) {
        querystring += i + eq + query[i] + sep;
      }

      if (querystring.length > 0)
        querystring = '?' + querystring.slice(0, -1);
    }
    return querystring;
  };

  var formatURL = function(obj, sep, eq) {

    var querystring = formatQuery(obj.query);

    return [
      obj.secure ? 'https' : 'http',
      '://',
      obj.host,
      obj.port ? ':' + obj.port : '',
      obj.path || '/',
      querystring,
      obj.hash || ''
    ].join('');
  };

  var parseStringHeaders = function(str) {
    var headers = {};
    if (str) {
      var lines = str.split('\n');
      for (var i = 0; i < lines.length; i++) {
        if (!lines[i])
          continue;

        var keyvalue = lines[i].split(':');
        headers[keyvalue[0].toLowerCase()] = keyvalue.slice(1).join().trim();
      }
    }
    return headers;
  };

  var XMLHttpRequest = global.XMLHttpRequest;

  var jsonp = function(opts, fn) {
    var cb = opts.query[opts.jsonp];
    var url = formatURL(opts);

    var el = document.createElement('script');
    el.src = url;
    el.async = true;

    global[cb] = function(b) {
      fn(null, b);
      delete global[cb];
      delete el.onerror;
      el.parentNode.remove(el);
    };

    el.onerror = function(e) {
      fn(e);
      delete el.onerror;
      delete global[cb];
      el.parentNode.remove(el);
    };

    var head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(el);
  };

  var HTTPRequest = function(opts) {
    opts = utils.handleOptions(opts);
    for (var j in opts)
      this[j] = opts[j];

    var request = this;
    this.request = this;
    var response = new utils.HTTPResponse();
    this.response = response;

    if (opts.body && (opts.method === 'GET' || opts.method === 'HEAD')) {
      console.warn('Request body ignored for GET and HEAD methods with XMLHttpRequest');
    }

    //jsonp
    if (typeof opts.jsonp === 'string') {
      if (opts.body)
        console.warn('Request body ignored for JSONP');

      jsonp(opts, function(err, body) {
        if (err)
          request.onerror(err);
        else
          response.onend(body);
      });
      return;
    }

    var req = new XMLHttpRequest();
    this.impl = req;

    req.addEventListener('error', function(err) {
      request.onerror(err);
    });

    req.addEventListener('readystatechange', function() {
      //0   UNSENT  open()has not been called yet.
      //1   OPENED  send()has not been called yet.
      //2   HEADERS_RECEIVED  send() has been called, and headers and status are available.
      //3   LOADING   Downloading; responseText holds partial data.
      //4   DONE  The operation is complete.
      // if (req.readyState === 1) {
      //   this.onopen();
      // }
      if (req.readyState === 2) {
        response.status = req.status;
        var headers = parseStringHeaders(req.getAllResponseHeaders());
        response.headers = headers;
        response.type = utils.getTypeFromHeaders(headers);
        response.size = utils.getSizeFromHeaders(headers);
        request.onresponse(response);
      }
      else if (req.readyState === 4) {
        response.onend(req.response);
      }
    });

    req.addEventListener('progress', function(e) {
      response.onprogress(e.loaded, e.lengthComputable ? e.total : null);
    });

    req.upload.addEventListener('progress', function(e) {
      request.onprogress(e.loaded, e.lengthComputable ? e.total : null);
    });

    req.open(opts.method, formatURL(opts), true);

    // if (this.responseType)
    //   req.responseType = this.responseType;

    for (var k in opts.headers) {
      req.setRequestHeader(k, opts.headers[k]);
    }

    req.send(opts.body);
  };
  HTTPRequest.prototype.abort = function() {
    this.req.abort();
  };
  HTTPRequest.prototype.onresponse = function() {};
  HTTPRequest.prototype.onprogress = function() {};
  HTTPRequest.prototype.onerror = function() {};

  global.HTTPClient.Request = HTTPRequest;

})(this);