/*jslint indent: 2, maxlen: 80, browser: true */
/* -*- tab-width: 2 -*- */
/*globals define: true */
(function setup() {
  'use strict';

  function orf(x) { return (x || false); }
  function isStr(x) { return (typeof x === 'string'); }
  function ifObj(x, d) { return (((typeof x === 'object') && x) || d); }
  function ifFun(f, d) { return (typeof f === 'function' ? f : d); }
  function bind1(f, x, c) { return (f && f.bind((c || null), x)); }
  function arrLast(o, i) { return orf(o[o.length - (i || 1)]); }
  function fail(why) { throw new Error(String(why)); }
  function failIf(e, m) { if (e) { fail(m || e); } }
  function mustBeStr(x, d) { failIf(!isStr(x), d + ' must be a string'); }
  function strSplit(tx, rgx) { return String(tx || '').split(rgx); }

  function isMsieCallableObj(f) {
    return (ifObj(f) && (f.toString === undefined)
      && String(f).match(/^\s*function /) && true);
  }

  function quot(x) {
    try { return JSON.stringify(x); } catch (ignore) {}
    return ('"' + String(x).replace(/("|\\)/g, '\\$1') + '"');
  }

  var Obj = {}, urlLib;
  Obj.cr0 = bind1(ifFun(Object.create, Object), null);

  Obj.defPr = (function defProp(odp) {
    return (odp && function defPropStub(obj, prop, get, opts) {
      opts = (opts ? (ifFun(opts) ? { set: opts } : opts) : {});
      opts.get = get;
      opts.enumerable = true;
      return odp(obj, prop, opts);
    });
  }(orf(Object.defineProperty)));

  Obj.empty = (function compile() {
    var k = Object.keys;
    if (k) {
      return function objIsEmpty(x) { return (k(x).length === 0); };
    }
    return function objIsEmpty(x) {
      var p;
      for (p in x) {
        if (Object.prototype.hasOwnProperty.call(x, p)) { return false; }
      }
      return true;
    };
  }());


  urlLib = (function compileUrlLib() {
    var EX = {}, resoRel;

    EX.doubleSlashModNameHint = /([\w\-])(\/{2})/g;
    EX.windowsFilePathRgx = /^file:\/+([A-Za-z]:|)\\/;
    EX.rgxNonDotChar = /[\x00-\-\/-\uFFFF]/;

    resoRel = function resolveRelativePath(origin, destPath, originHint) {
      EX.findProtocol(origin, '.resolveRelativePath origin for ' + originHint);
      //console.log('resolveRelativePath:', origin, '->', destPath);
      origin = EX.splitServerRelPath(origin);
      var destSub = EX.parentDir(origin.relPath, Array);
      if (!Array.isArray(destPath)) {
        destPath = EX.splitPath(destPath);
      }
      while (destSub[0] === '.') { destSub.shift(); }
      destPath.forEach(function each(dir) {
        if ((dir === '..') && (destSub.length > 0)) { destSub.pop(); }
        if ((dir === '') || EX.rgxNonDotChar.exec(dir)) { destSub.push(dir); }
      });
      destSub = destSub.join('/');
      if (destSub[0] !== '/') { destSub = '/' + destSub; }
      return origin.basePath + destSub;
    };
    EX.resolveRelativePath = resoRel;

    EX.splitServerRelPath = function splitServerRelPath(url) {
      /* For simple URIs, this split should be roughly the same as
      /  location.{origin,pathname}. However, for URLs with server names
      /  in them (e.g. Wayback machine), the origin part here is greedy,
      /  in order to ensure the relPath stays inside one server even when
      /  proxied or archived. If you want cross-domain loading, specify
      /  a full URL instead of relative paths.  */
      url = strSplit(url, /\b([a-z]+:\/+[\x00-\.0-\uFFFF]*)\/?/);
      var rel = url.pop();
      return { basePath: url.join(''), relPath: rel };
    };

    EX.splitPath = function splitPath(path) {
      return strSplit(path, /\/(?:\.\/)*/);
    };

    EX.findProtocol = function findProtocol(url, mustHave) {
      var proto = String(url).match(/^([a-z]{2,8}):/);
      if (proto) { return proto[0]; }
      if (!mustHave) { return ''; }
      fail('Unable to find protocol name in ' + mustHave + ' = ' + url);
    };

    EX.parentDir = function parentDir(path, fmt) {
      path = EX.splitPath(path).slice(0, -1);
      if (fmt === Array) { return path; }
      return (path.legth > 0 ? path.join('/') : '.');
    };

    EX.fileUrlOnly = function fileUrlOnly(url) {
      return String(url || '').split(/#|\?/)[0];
    };

    EX.slashWindowsPath = function slashWindowsPath(p) {
      return (p.match(EX.windowsFilePathRgx) ? p.replace(/\\/g, '/') : p);
    };

    EX.normalizeFileUrl = function normalizeFileUrl(url, origin) {
      if (ifObj(url)) { url = url.href || url.src; }
      url = EX.fileUrlOnly(url);
      url = EX.slashWindowsPath(url);
      url = url.replace(EX.doubleSlashModNameHint, '$1/');
      if (origin && (!EX.findProtocol(url))) {
        url = resoRel(origin, url, '.normalizeFileUrl');
      }
      return url;
    };

    return EX;
  }());




  function factory() {
    var EX = { fakeUrlPrefix: 'cjs-minifake://' }, modReg = Obj.cr0();

    function fakeMod(modFile, modObj, modName) {
      var modUrl = EX.fakeUrlPrefix + modFile;
      // Using fake URLs because we can't detect the script name without
      // a document, but also don't want to defer selfreg until a window
      // and a document are set.
      modReg[modUrl] = modObj;
      if (modName) { modReg[':' + modName] = modUrl; }
    }
    fakeMod('core', EX, 'cjs-minifake-pmb');
    fakeMod('urlLib', urlLib);

    EX.window = false;
    EX.setWindow = function setWindow(win) {
      var byTag = orf(orf(win).document).getElementsByTagName;
      if (!ifFun(byTag)) {
        if (!isMsieCallableObj(byTag)) {
          fail('New window object must provide .document.getElementsByTagName');
        }
      }
      EX.window = win;
      fakeMod('window', win);
      fakeMod('window-pmb', win);
      if (win.require || win.module || win.exports) { return; }
      if (!win.define) { win.define = EX.define; }
      win.module = EX.module;
      win.require = EX.require;
      if (Obj.defPr) {
        Obj.defPr(win, 'exports', EX.getExports, { configurable: false });
      }
    };
    EX.factory = factory;   /*
      ^-- make a new instance that can use another window */

    EX.require = function req(opts, modUrl) {
      modUrl = EX.require.resolve(opts, modUrl);
      var modObj = modReg[modUrl];
      if (modObj) { return modObj; }
      return fail('reqire: module not available: ' + modUrl);
    };

    EX.require.resolve = function requireResolve(opts, modSpec) {
      var modUrl, found = '', baseUrl;
      if (isStr(opts)) {
        modSpec = opts;
        opts = {};
      }
      mustBeStr(modSpec, 'module name');
      if ((!modUrl) && modSpec.match(/^\.{1,2}\//)) {
        //console.log('resolve: origin:', opts.origin);
        baseUrl = (opts.origin || EX.guessModuleUrl(false));
        //console.log('resolve: baseUrl:', baseUrl);
        modUrl = urlLib.resolveRelativePath(baseUrl, modSpec,
          'require.resolve: ' + modSpec);
      }
      if ((!modUrl) && (!urlLib.findProtocol(modSpec))) {
        modUrl = urlLib.splitPath(modSpec);
        modUrl.base = modReg[':' + modUrl[0]];
        modUrl = (modUrl.base
          ? (modUrl.length === 1 ? modUrl.base
              : urlLib.resolveRelativePath(modUrl.base, modUrl.slice(1)))
          : modUrl.join('/'));
      }
      if (!modUrl) { return fail('unsupported module spec: ' + modSpec); }
      if (modReg[modUrl]) { return modUrl; }
      (opts.suffixes || EX.require.suffixes).forEach(function runFx(sfx) {
        if (found) { return; }
        sfx = modUrl + sfx;
        if (modReg[sfx]) { found = sfx; }
      });
      if (found) { return found; }
      found = EX.fakeUrlPrefix + modSpec;
      if (modReg[found]) { return found; }
      return fail('Module not available: ' + quot(modSpec) +
        (modSpec === modUrl ? '' : ' = ' + quot(modUrl)));
    };
    EX.require.suffixes = ['.js', '.json'];

    EX.require.internalCache = function getCache() { return modReg; };

    EX.pageUrl = function detectPageUrl() {
      var url = urlLib.slashWindowsPath(EX.doc().URL);
      urlLib.findProtocol(url, 'document.URL');
      return url;
    };

    EX.getExports = function getExports(modUrl) {
      if (!modUrl) { modUrl = EX.guessModuleUrl(true); }
      // ^-- guessModuleUrl will also ensure there's at least an empty object.
      return modReg[modUrl];
    };

    EX.setExports = function setExports(modUrl, exp) {
      mustBeStr(modUrl, 'modUrl for .setExports');
      if (!modUrl) { modUrl = EX.guessModuleUrl(true); }
      var prevExp = modReg[modUrl];
      if (!prevExp) { fail("guessModuleUrl hasn't prepared empty exports??"); }
      if (prevExp === exp) { return; }
      if (Obj.empty(prevExp)) { prevExp = null; }
      if (prevExp) { fail("Won't overwrite previous exports for " + modUrl); }
      modReg[modUrl] = exp;
    };

    EX.guessModuleUrl = function guessModuleUrlFromScriptTag(registerModName) {
      var sTag = EX.guessActiveScriptTag(), modName, modUrl = sTag.src,
        docUrl = EX.pageUrl();
      modUrl = (modUrl ? urlLib.normalizeFileUrl(modUrl, docUrl) : docUrl);
      if (!modUrl) { return fail('guessModuleUrlFromScriptTag(): no url'); }
      if (modReg[modUrl]) {
        // we've seen it before, no need to guess its name again.
        return modUrl;
      }
      modReg[modUrl] = {};
      if (registerModName) {
        modName = EX.guessModuleNameFromScriptTag(sTag);
        if (modName) { EX.registerModuleByName(modName, modUrl); }
      }
      //console.log('guessModuleUrl:', sTag, modUrl);
      return modUrl;
    };

    EX.registerModuleByName = function registerModuleByName(modName, modUrl) {
      if (!modName) { return; }
      mustBeStr(modUrl, 'modUrl for .registerModuleByName');
      if (modReg[':' + modName]) {
        return fail("won't replace registered module " + modName);
      }
      modReg[':' + modName] = modUrl;
    };

    EX.module = (Obj.defPr && (function defineModuleProperties(m) {
      Obj.defPr(m, 'filename', bind1(EX.guessModuleUrl, false));
      Obj.defPr(m, 'exports', EX.getExports, bind1(EX.setExports, ''));
      Obj.defPr(m, 'scriptTag', EX.guessActiveScriptTag);
    }(Obj.cr0())));

    EX.doc = function getDoc() {
      var doc = orf(EX.window).document;
      if (ifObj(doc)) { return doc; }
      return fail('Supply a window via .setWindow() first');
    };

    EX.guessActiveScriptTag = function guessActiveScriptTag() {
      var st = arrLast(EX.doc().getElementsByTagName('script'),
        guessActiveScriptTag.nth);
      if (st) { return st; }
      return fail('Unable to guessActiveScriptTag()');
    };
    EX.guessActiveScriptTag.nth = 1;

    EX.moduleNameRgx = /^[A-Za-z0-9_\-]+$/;

    EX.guessModuleNameFromScriptTag = function guessModNameFromScriptTag(tag) {
      var modName, src = tag.getAttribute('src'),
        trace = 'CJS minifake: guessModuleNameFromScriptTag:';
      modName = (function guessInternal() {
        var mn = tag.getAttribute('modname') || '';
        if (mn) { return mn; }
        if (!src) { return ''; }

        mn = src.split(EX.doubleSlashModNameHint);
        if (mn.length >= 2) { return arrLast(mn).split(/\/|\./)[0]; }

        mn = src.split(/(?:^|\/)node_modules\//);
        if (mn.length >= 2) { return arrLast(mn).split('/')[0]; }
      }());
      if (!modName) { return ''; }
      if (!EX.moduleNameRgx.exec(modName)) {
        console.warn(trace, 'Discard scary module name:', modName);
        return '';
      }
      if (modName === 'node_modules') {
        console.error(trace, 'Module name must not be "node_modules"!'
          + ' Use modname="" or a double slash before the directory name'
          + ' to indicate the actual module name of', src);
        return '';
      }
      return modName;
    };

    EX.define = function defineModule(modName, modExports) {
      var srcUrl = EX.guessModuleUrl(true), modFac, m = modReg[srcUrl];
      if (!isStr(modName)) {
        modExports = modName;
        modName = null;
      }
      //console.log('amd.define()ing:', modName);
      if (srcUrl === EX.pageUrl()) {
        m = ('A module cannot be registered as the same URL as the currently'
          + ' loaded webpage. This can occurr if you accidentially loaded'
          + ' the module asynchronously, e.g. as type=module.');
        fail(m);
      }

      (function checkConflict() {
        var had = modReg[srcUrl];
        if (Obj.empty(had)) { return; }
        if (modExports === modReg[srcUrl]) { return; }
        fail('cannot re-define().amd module ' + srcUrl);
      }());

      if (typeof modExports === 'function') {
        modFac = modExports;
        modExports = {};
        m = { filename: srcUrl, exports: modExports,
          scriptTag: EX.guessActiveScriptTag() };
        modFac = modFac(bind1(EX.require, { origin: srcUrl }),
          modExports, m);
        if (m.exports) { modExports = m.exports; }
        if (modFac && Obj.empty(modExports)) { modExports = modFac; }
      }
      modReg[srcUrl] = modExports;
      //console.log('amd.define()d:', srcUrl);
      EX.registerModuleByName(modName, modName, srcUrl);
    };
    EX.define.amd = true;


    if ((typeof window === 'object') && window) { EX.setWindow(window); }
    return EX;
  }



  if ((typeof define === 'function') && define.amd) { return define(factory); }
  (function (e, m) { if (m && m.exports) { m.exports = e; } }(factory(),
    (typeof module === 'object') && module));
}());
