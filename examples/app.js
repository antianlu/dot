var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var dot = require('../');
var http = require('http');

var share_defs = require('./share_defs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'dot');
console.log(app.get('views'));
//dot config
//dot.templateSettings = {
//  evaluate: /\{\%([\s\S]+?(\}?)+)\%\}/g,
//  interpolate: /\{\%=([\s\S]+?)\%\}/g,
//  encode: /\{\%!([\s\S]+?)\%\}/g,
//  use: /\{\%#([\s\S]+?)\%\}/g,
//  useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
//  define: /\{\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\}/g,
//  defineParams: /^\s*([\w$]+):([\s\S]+)/,
//  conditional: /\{\%\?(\?)?\s*([\s\S]*?)\s*\%\}/g,
//  iterate: /\{\%~\s*(?:\%\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\})/g,
//  varname: "it",
//  strip: true,
//  append: true,
//  selfcontained: false,
//  doNotSkipEncoded: false
//};
// config path params is templates path,you use array or string
// carefully the path order
app.engine('dot', dot.__express({
  path: app.get('views'),// or string(one path)
  env: 'production' || app.get('env'),
  share_defs: share_defs,// function : key/value  example {'common/footer':'<h1></h1>'
  cache: false// use static page,warming
  //templateSettings:templateSettings
}));
app.use('/update/common',function(req,res,next){
  app.engine('dot', dot.__express({
    path: app.get('views'),// or string(one path)
    env: app.get('env'),
    share_defs: share_defs,// function : key/value  example {'common/footer':'<h1></h1>'
    cache: false// use static page,warming
    //templateSettings:templateSettings
  }));
  res.end('haha')
});
console.log(app.get('env'))

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// var port = normalizePort(process.env.PORT || '3001');
app.set('port', 3001);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(app.get('port'));
// module.exports = app;
