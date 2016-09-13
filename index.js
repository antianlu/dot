var fs = require("fs"),
  path = require('path'),
  doT = module.exports = require("./doT"),
  templateCaches = {};
//doT.process = function (options) {
//    //path, destination, global, rendermodule, templateSettings
//    return new InstallDots(options).compileAll();
//};

function InstallDots(o) {
  var self = this;
  this.__path = o.path || "./";
  // support muti folder
  if (Array.isArray(this.__path)) {
    for (var i = 0, len = this.__path.length; i < len; i++) {

      this.__path[i] = this.__path[i].replace(/\\/g, '/');
      if (this.__path[i][this.__path[i].length - 1] !== '/')
        this.__path[i] += '/';
      // .jst file output use
      this.__destination = o.destination || this.__path;
      if (this.__destination[i][this.__destination[i].length - 1] !== '/')
        this.__destination[i] += '/';
    }
  }
  else {
    this.__path = this.__path.replace(/\\/g, '/');
    if (this.__path[this.__path.length - 1] !== '/')
      this.__path += '/';
    // .jst file output user
    this.__destination = o.destination || this.__path;
    if (this.__destination[this.__destination.length - 1] !== '/')
      this.__destination += '/';
  }
  // set global
  this.__global = o.global || "window.render";
  // cache all .dot template
  this.__rendermodule = o.rendermodule || {};
  // get settings,first use doT.settings;
  this.__settings = o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
  // cache all .def templates
  this.__includes = {};

  this.share_defs = o.share_defs || function () {
      return {};
    };
  this.updateShareDefs = null;

  this.__includes._include = function (fname) {
    // fname: sub/hello,footer,sub/footer,sub/footer.def
    var exist = fname.match(/\.def|\.dot$/);
    if ('' + exist == '.def')
      fname = fname.substring(0, fname.indexOf('.'));
    // if (self.__includes[fname]) {
    //   return self.__includes[fname];
    // }
    // else
    //   return self.__rendermodule[fname];
    if (self.__includes[fname])
      return self.__includes[fname];
    else
      return readdata(fname);
  };
}

/**
 * compile .jst file to folder
 * @param path
 * @param template
 * @param def
 */
InstallDots.prototype.compileToFile = function (path, template, def) {
  def = def || {};
  var modulename = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf("."))
    , defs = copy(this.__includes, copy(def))
    , settings = this.__settings || doT.templateSettings
    , compileoptions = copy(settings)
    , defaultcompiled = doT.template(template, settings, defs)
    , exports = []
    , compiled = ""
    , fn;

  for (var property in defs) {
    if (defs[property] !== def[property] && defs[property] !== this.__includes[property]) {
      fn = undefined;
      if (typeof defs[property] === 'string') {
        fn = doT.template(defs[property], settings, defs);
      } else if (typeof defs[property] === 'function') {
        fn = defs[property];
      } else if (defs[property].arg) {
        compileoptions.varname = defs[property].arg;
        fn = doT.template(defs[property].text, compileoptions, defs);
      }
      if (fn) {
        compiled += fn.toString().replace('anonymous', property);
        exports.push(property);
      }
    }
  }
  compiled += defaultcompiled.toString().replace('anonymous', modulename);
  fs.writeFileSync(path, "(function(){" + compiled
    + "var itself=" + modulename + ", _encodeHTML=(" + doT.encodeHTMLSource.toString() + "(" + (settings.doNotSkipEncoded || '') + "));"
    + addexports(exports)
    + "if(typeof module!=='undefined' && module.exports) module.exports=itself;else if(typeof define==='function')define(function(){return itself;});else {"
    + this.__global + "=" + this.__global + "||{};" + this.__global + "['" + modulename + "']=itself;}}());");
};

function addexports(exports) {
  for (var ret = '', i = 0; i < exports.length; i++) {
    ret += "itself." + exports[i] + "=" + exports[i] + ";";
  }
  return ret;
}

function copy(o, to) {
  to = to || {};
  for (var property in o) {
    to[property] = o[property];
  }
  return to;
}

function readdata(path) {
  var data = fs.readFileSync(path);
  if (data) return data.toString();
  console.log("problems with " + path);
}

/**
 * compile .dot files
 * @param path
 * @returns {*}
 */
InstallDots.prototype.compilePath = function (path) {
  var data = readdata(path);
  if (data) {
    return doT.template(data,
      this.__settings || doT.templateSettings,
      copy(this.__includes));
  }
};
InstallDots.prototype.compileTemplate = function (data) {
  return doT.template(data,
    this.__settings || doT.templateSettings,
    copy(this.__includes));
}

InstallDots.prototype.compileDef = function () {
  var paths = this.__path, self = this;
  // support embed folder .def or .dot file(.dot must add suffix)
  // TODO:params
  function doCompileDef(rootFolder, path_dir) {
    var sources = fs.readdirSync(path_dir),
      k, l, fname, name, kname;
    for (k = 0, l = sources.length; k < l; k++) {
      fname = sources[k];
      if (/\.def(\.dot|\.jst)?$/.test(fname)) {
        name = fname.substring(0, fname.indexOf('.'));
        kname = path_dir != rootFolder ? (path_dir.split(rootFolder)[1] + name) : name;
        self.__includes[kname] = readdata(path_dir + fname);
        console.log("Compiling " + fname + " to function");
      }
      if (fname.indexOf('.') == -1 && fs.existsSync(path_dir + fname)) {
        doCompileDef(rootFolder, path_dir + fname + '/');
      }
    }
  }

  if (Array.isArray(paths)) {
    for (var i = 0, len = paths.length; i < len; i++) {
      var rootFolder = paths[i];
      doCompileDef(rootFolder, rootFolder);
    }
  }
  else {
    doCompileDef(paths, paths);
  }
  var share_defs = this.share_defs();
  for (var sds in share_defs) {
    this.__includes[sds] = share_defs[sds];
  }
  return this.__includes;
};

InstallDots.prototype.compileDot = function () {
  var paths = this.__path, self = this;

  function doCompileDot(rootFolder, path_dir) {
    var sources = fs.readdirSync(path_dir),
      k, l, name, kname;
    for (k = 0, l = sources.length; k < l; k++) {
      name = sources[k];
      if (/\.dot(\.def|\.jst)?$/.test(name)) {
        kname = path_dir != rootFolder ? (path_dir.split(rootFolder)[1] + name) : name;
        console.log("Compiling " + kname + " to function");
        // self.__includes[kname] = readdata(path_dir + name);
        self.__rendermodule[kname] = self.compilePath(path_dir + name);
      }
      if (/\.jst(\.dot|\.def)?$/.test(name)) {
        console.log("Compiling " + name + " to file");
        self.compileToFile(path_dir + name.substring(0, name.indexOf('.')) + '.js',
          readdata(path_dir + name));
      }

      if (name.indexOf('.') == -1 && fs.existsSync(path_dir + name)) {
        doCompileDot(rootFolder, path_dir + name + '/');
      }
    }
  }

  if (Array.isArray(paths)) {
    for (var i = 0, len = paths.length; i < len; i++) {
      var rootFolder = paths[i];
      doCompileDot(rootFolder, rootFolder);
    }
  }
  else {
    doCompileDot(paths, paths);
  }
  return this.__rendermodule;
};

InstallDots.prototype.compileAll = function () {
  this.compileDef(), this.compileDot();
  return this.__rendermodule;
};

doT.InstallDots = InstallDots;

/**
 * express doT engine
 * @param config
 * @returns {Function}
 * @private
 */
doT.__express = function (config) {
  var config = config || {},
    env = config.env || 'production',
    viewPaths = config.path, _dot, dt;
  // check path exists
  if (Array.isArray(viewPaths)) {
    for (var i = 0; i < viewPaths.length; i++) {
      if (!fs.existsSync(viewPaths[i])) {
        // delete it
        console.error('this view path [' + viewPaths[i] + '] is not exist');
        viewPaths.splice(i, 1);
      }
    }
  }
  _dot = new InstallDots(config);
  // if env is production compile all
  if ('development' != env)
    dt = _dot.compileAll();

  return function (filePath, options, cb) {
    var key, _html, tmp;
    filePath = filePath.replace(/\\/g, '/');
    if (!(/\.dot$/.test(filePath))) throw Error('extension must be is .dot');
    if ('development' == env) {
      _dot.compileDef();
      _html = _dot.compilePath(filePath)(options);
    }
    else {
      if (Array.isArray(viewPaths)) {
        for (var i = 0; i < viewPaths.length; i++) {
          tmp = viewPaths[i].replace(/\\/g, '/');
          if (filePath.split(tmp).length > 1) {
            key = filePath.split(tmp)[1].replace(/^(\/|\\)/, '');
            break;
          }
        }
      }
      else {
        tmp = viewPaths.replace(/\\/g, '/');
        key = filePath.split(tmp)[1].replace(/^(\/|\\)/, '');
      }

      // 针对寸静态，只加载绑定一次数据
      if (config.cache) {
        if (!templateCaches[key]) {
          _html = dt[key](options);
          templateCaches[key] = _html;
          return cb(null, _html);
        }
        else {
          return cb(null, templateCaches[key]);
        }
      }
      // console.log(key,options,'======')
      _html = dt[key](options);
    }
    return cb(null, _html);
  };
};