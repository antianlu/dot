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
            doCompaile(rootFolder, rootFolder)
        }
    }
    else {
        doCompaile(paths, paths)
    }

    function doCompaile(rootFolder, path_dir) {
        var sources = fs.readdirSync(path_dir),
            k, l, name, kname;
        for (k = 0, l = sources.length; k < l; k++) {
            name = sources[k];
            if (/\.def(\.dot|\.jst)?$/.test(name)) {
                kname = path_dir != rootFolder ? (path_dir.split(rootFolder)[1] + name) : name;
                console.log("Compiling " + kname + " to function");
                self.__includes[kname] = readdata(path_dir + name);
            }

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
                doCompaile(rootFolder, path_dir + name + '/');
            }
        }
    }

    return this.__rendermodule;
};

doT.__express = function (config) {
    var config = config || {},
        viewPaths = config.path,
        dt = new InstallDots(config).compileAll();
    return function (filePath, options, cb) {
        var key, _html;
        filePath = filePath.replace(/\\/g, '/');
        if (!(/\.dot$/.test(filePath))) throw Error('extension must be is .dot');
        for (var i = 0; i < viewPaths.length; i++) {
            if (filePath.split(viewPaths[i]).length > 1) {
                key = filePath.split(viewPaths[i])[1].replace(/^(\/|\\)/, '').replace(/\\/g, '/');
                break;
            }
        }
        if (config.cache) {
            if (!templateCaches[key]) {
                _html = dt[key](options);
                //console.log(key, ' do cache')
                templateCaches[key] = _html;
                return cb(null, _html);
            }
            else {
                //console.log(key, ' from cache')
                return cb(null, templateCaches[key]);
            }
        }
        _html = dt[key](options);
        //console.log(key, ' from no cache ')
        return cb(null, _html);
    };
};