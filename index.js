/* doT + auto-compilation of doT templates
 *
 * 2012, Laura Doktorova, https://github.com/olado/doT
 * Licensed under the MIT license
 *
 * Compiles .def, .dot, .jst files found under the specified path.
 * It ignores sub-directories.
 * Template files can have multiple extensions at the same time.
 * Files with .def extension can be included in other files via {{#def.name}}
 * Files with .dot extension are compiled into functions with the same name and
 * can be accessed as renderer.filename
 * Files with .jst extension are compiled into .js files. Produced .js file can be
 * loaded as a commonJS, AMD module, or just installed into a global variable
 * (default is set to window.render).
 * All inline defines defined in the .jst file are
 * compiled into separate functions and are available via _render.filename.definename
 *
 * Basic usage:
 * var dots = require("dot").process({path: "./views"});
 * dots.mytemplate({foo:"hello world"});
 *
 * The above snippet will:
 * 1. Compile all templates in views folder (.dot, .def, .jst)
 * 2. Place .js files compiled from .jst templates into the same folder.
 *    These files can be used with require, i.e. require("./views/mytemplate").
 * 3. Return an object with functions compiled from .dot templates as its properties.
 * 4. Render mytemplate template.
 */

var fs = require("fs"),
    path = require('path'),
    doT = module.exports = require("./doT"),
    templateCaches = {};
//doT.process = function (options) {
//    //path, destination, global, rendermodule, templateSettings
//    return new InstallDots(options).compileAll();
//};

function InstallDots(o) {
    this.__path = o.path || "./";
    if (this.__path[this.__path.length - 1] !== '/') this.__path += '/';
    this.__destination = o.destination || this.__path;
    if (this.__destination[this.__destination.length - 1] !== '/') this.__destination += '/';
    this.__global = o.global || "window.render";
    this.__rendermodule = o.rendermodule || {};
    this.__settings = o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
    this.__includes = {};
}

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

InstallDots.prototype.compilePath = function (path) {
    var data = readdata(path);
    if (data) {
        return doT.template(data,
            this.__settings || doT.templateSettings,
            copy(this.__includes));
    }
};

InstallDots.prototype.compileAll = function () {
    console.log("Compiling all doT templates...");

    var defFolder = this.__path, self = this;

    function allIncludeFiles(path_dir) {
        var sources = fs.readdirSync(path_dir),
            k, l, name, kname;
        for (k = 0, l = sources.length; k < l; k++) {
            name = sources[k];
            if (/\.def(\.dot|\.jst)?$/.test(name)) {
                kname = path_dir != defFolder ? (path_dir.split(defFolder)[1] + name) : name;
                self.__includes[kname] = readdata(path_dir + name);
            }
            if (name.indexOf('.') == -1 && fs.existsSync(path_dir + name)) {
                allIncludeFiles(path_dir + name + '/');
            }
        }
    }

    this.__includes._include = function (fname) {
        // fname: sub/hello,footer,sub/footer,sub/footer.def
        var ext = path.extname(fname);
        fname = ext ? fname : fname + '.def';
        if (self.__includes[fname])
            return self.__includes[fname];
        else
            return readdata(fname);
    }

    function allRenderFiles(path_dir) {

        var sources = fs.readdirSync(path_dir),
            k, l, name, vname, kname;
        for (k = 0, l = sources.length; k < l; k++) {
            name = sources[k];
            if (/\.dot(\.def|\.jst)?$/.test(name)) {
                kname = path_dir != defFolder ? (path_dir.split(defFolder)[1] + name) : name;
                console.log("Compiling " + kname + " to function");
                self.__rendermodule[kname] = self.compilePath(path_dir + name);
            }
            if (/\.jst(\.dot|\.def)?$/.test(name)) {
                console.log("Compiling " + name + " to file");
                self.compileToFile(self.__destination + name.substring(0, name.indexOf('.')) + '.js',
                    readdata(defFolder + name));
            }
            if (name.indexOf('.') == -1 && fs.existsSync(path_dir + name)) {
                allRenderFiles(path_dir + name + '/');
            }
        }
    }

    allIncludeFiles(defFolder);
    allRenderFiles(defFolder);
    return this.__rendermodule;
};

doT.__express = function (config) {
    var config = config || {},
        viewPath = /\/$/.test(config.path) ? config.path : config.path + '/',
        dt = new InstallDots(config).compileAll();
    return function (filePath, options, cb) {
        var key, _html;
        if (!(/\.dot$/.test(filePath))) throw Error('extension must be is .dot');
        key = filePath.split(viewPath)[1];
        console.log(key, 'filepath')
        if (config.cache) {
            if (!templateCaches[key]) {
                _html = dt[key](options);
                console.log(key, ' do cache')
                templateCaches[key] = _html;
                return cb(null, _html);
            }
            else {
                console.log(key, ' from cache')
                return cb(null, templateCaches[key]);
            }
        }
        _html = dt[key](options);
        console.log(key, ' from no cache ')
        return cb(null, _html);
    };
};