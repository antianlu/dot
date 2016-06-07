/**
 * Created by antianlu on 16/2/16.
 * 1.模板+data(动态读取实时渲染)，这个对于经常更新的非常有用
 * 2.模板缓存(需要重启node服务才能更新)+data实时渲染，动态页面
 * 3.针对1做短时间缓存，偏纯静态页面
 *
 *
 * 解决问题：模板的读取、是否缓存、缓存时间控制，模板读取控制
 * 扩展include方法，路径寻址(保留之前版本)
 */

var fs = require("fs"),
  path = require('path'),
  doT = module.exports = require("./doT");
//templateCaches = {};

// cach list:key,expire time, status
global.dotCaches = {};
global.dotCacheType = {
  DEFAULT: 1,//默认；模板永久缓存，直到重启服务
  JST: 2,//模板实时重新编译
  DURATION: 3//模板设置过期时间，到期重新编译模板
};

/**
 * 初始化编译模板并缓存的类型
 * @param o 配置参数
 * @constructor
 */
function CompileDots(o) {
  this.__path = o.path || "./";
  if (Array.isArray(this.__path)) {
    for (var i = 0, len = this.__path.length; i < len; i++) {
      this.__path[i] = this.__path[i].replace(/\\/g,'/');
      if (this.__path[i][this.__path[i].length - 1] !== '/') this.__path[i] += '/';
      this.__destination = o.destination || this.__path;
      if (this.__destination[i][this.__destination[i].length - 1] !== '/') this.__destination[i] += '/';
    }
  }
  else {
    this.__path = this.__path.replace(/\\/g,'/');
    if (this.__path[this.__path.length - 1] !== '/') this.__path += '/';
    this.__destination = o.destination || this.__path;
    if (this.__destination[this.__destination.length - 1] !== '/') this.__destination += '/';
  }
  //this.__destination = o.destination || this.__path;
  //if (this.__destination[this.__destination.length - 1] !== '/') this.__destination += '/';
  this.__global = o.global || "window.render";
  this.__rendermodule = o.rendermodule || {};
  this.__settings = o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
  this.__includes = {};
}

/**
 * 即时编译，包括模板即时初始化
 * @param opts
 * @constructor
 */
function JITCompilerDots(opts) {

}


CompileDots.prototype.compileDefault = function () {
  console.log("Compiling all doT templates...");

  //var defFolder = this.__path, self = this;
  var paths = this.__path, self = this;
  this.__includes._include = function (fname) {
    // fname: sub/hello,footer,sub/footer,sub/footer.def
    var ext = path.extname(fname);
    fname = ext ? fname : fname + '.def';
    if (self.__includes[fname])
      return self.__includes[fname];
    else
      return readdata(fname);
  };

  if (Array.isArray(paths)) {
    for (var i = 0, len = paths.length; i < len; i++) {
      var rootFolder = paths[i];
      doCompaileDef(rootFolder, rootFolder),doCompaileDot(rootFolder, rootFolder)
    }
  }
  else {
    doCompaileDef(paths, paths),doCompaileDot(paths, paths)
  }

  function doCompaileDef(rootFolder, path_dir) {
    var sources = fs.readdirSync(path_dir),
      k, l, name, kname;
    for (k = 0, l = sources.length; k < l; k++) {
      name = sources[k];
      if (/\.def(\.dot|\.jst)?$/.test(name)) {
        kname = path_dir != rootFolder ? (path_dir.split(rootFolder)[1] + name) : name;
        console.log("Compiling " + kname + " to function");
        self.__includes[kname] = readdata(path_dir + name);
      }
      if (name.indexOf('.') == -1 && fs.existsSync(path_dir + name)) {
        doCompaileDef(rootFolder, path_dir + name + '/');
      }
    }
  }

  function doCompaileDot(rootFolder, path_dir) {
    var sources = fs.readdirSync(path_dir),
      k, l, name, kname;
    for (k = 0, l = sources.length; k < l; k++) {
      name = sources[k];
      if (/\.dot(\.def|\.jst)?$/.test(name)) {
        kname = path_dir != rootFolder ? (path_dir.split(rootFolder)[1] + name) : name;
        console.log("Compiling " + kname + " to function");
        self.__includes[kname] = readdata(path_dir + name);
        self.__rendermodule[kname] = self.compilePath(path_dir + name);
      }
      if (/\.jst(\.dot|\.def)?$/.test(name)) {
        console.log("Compiling " + name + " to file");
        self.compileToFile(path_dir + name.substring(0, name.indexOf('.')) + '.js',
          readdata(path_dir + name));
      }

      if (name.indexOf('.') == -1 && fs.existsSync(path_dir + name)) {
        doCompaileDot(rootFolder, path_dir + name + '/');
      }
    }
  }

  return this.__rendermodule;
};

/**
 * 初始化配置dot模板参数等
 * @param config
 * @returns {Function}
 * @private
 */
doT.__express = function (config) {
  return function (path, opts, callback) {
    // path = __dirname+path also is key
  };

};