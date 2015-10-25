(function(global) {

  'use strict';

  var base64;
  if (typeof Buffer !== 'undefined') {
    base64 = function(str) {
      return (new Buffer(str)).toString('base64');
    };
  }
  else {
    base64 = global.btoa;
  }

  var methods = [
    //http://tools.ietf.org/html/rfc2616
    'OPTIONS',
    'GET',
    'HEAD',
    'POST',
    'PUT',
    'DELETE',
    'TRACE',
    'CONNECT',
    //http://tools.ietf.org/html/rfc5789
    'PATCH'
  ];

  var getPrototypeOf = function(obj) {
    if (Object.getPrototypeOf)
      return Object.getPrototypeOf(obj);
    else
      return obj.__proto__;
  };

  var prototypeOfObject = getPrototypeOf({});

  var isObject = function(obj) {
    if (typeof obj !== 'object')
      return false;

    return getPrototypeOf(obj) === prototypeOfObject || getPrototypeOf(obj) === null;
  };

  var defaultOptions = {
    query: {},
    secure: false,
    host: 'localhost',
    path: '/',
    headers: {},
    method: 'GET',
    port: 80,
    jsonp: false,
    username: '',
    password: ''
  };

  var handleOptions = function(opts, overrides) {

    opts = opts || {};

    var options = {};

    for (var i in defaultOptions) {
      if (typeof opts[i] === typeof defaultOptions[i])
        options[i] = opts[i];
      else if (overrides && typeof overrides[i] === typeof defaultOptions[i])
        options[i] = overrides[i];
      else
        options[i] = defaultOptions[i];
    }

    options.method = options.method.toUpperCase();

    //jsonp
    if (opts.jsonp === true)
      opts.jsonp = 'callback';
    if (typeof opts.jsonp === 'string') {
      options.jsonp = opts.jsonp;
      options.query[opts.jsonp] = 'HTTPClient' + Date.now();
    }

    //lower cases headers
    for (var k in options.headers) {
      var v = options.headers[k];
      delete options.headers[k];
      options.headers[k.toLowerCase()] = v;
    }

    //basic auth
    if (typeof opts.username === 'string' && opts.username && typeof opts.password === 'string' && opts.password) {
      var creds = opts.username + ':' + opts.password;
      options.headers.authorization = 'Basic ' + base64(creds);
    }

    //json
    if (Array.isArray(opts.body) || isObject(opts.body)) {
      options.body = JSON.stringify(opts.body);
      if (!options.headers['content-type'])
        options.headers['content-type'] = 'application/json; charset=utf-8';
    }
    //string
    else if (typeof opts.body === 'string') {
      options.body = opts.body;
      if (!options.headers['content-type'])
        options.headers['content-type'] = 'text/plain; charset=utf-8';
    }
    else if (opts.body !== undefined || opts.body !== null) {
      options.body = opts.body;
    }

    return options;
  };

  var getTypeFromHeaders = function(headers) {
    var type = '';
    if (typeof headers === 'object') {
      var contentType = headers['content-type'];
      if (contentType)
        type = contentType.split(';')[0];
    }
    return type;
  };

  var getSizeFromHeaders = function(headers) {
    var size = null;
    if (typeof headers === 'object') {
      var contentLength = headers['content-length'];
      if (contentLength)
        size = parseInt(contentLength, 10);
    }
    return size;
  };

  var Promise;
  if (typeof module !== 'undefined' && module.exports) {
    if (!global.Promise) {
      try {
        Promise = require('es6-promise').Promise;
      }
      catch (ex) {}
    }
  }
  else {
    Promise = global.Promise;
  }

  var HTTPResponse = function() {
  };
  HTTPResponse.prototype.onend = function() {
  };
  HTTPResponse.prototype.onprogress = function() {
  };

  var utils = {
    handleOptions: handleOptions,
    getTypeFromHeaders: getTypeFromHeaders,
    getSizeFromHeaders: getSizeFromHeaders,
    getPrototypeOf: getPrototypeOf,
    Promise: Promise,
    methods: methods,
    defaultOptions: defaultOptions,
    HTTPResponse: HTTPResponse
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = utils;
  else
    global.HTTPClient = {utils: utils};

})(this);