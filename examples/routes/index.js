var express = require('express');
var router = express.Router();

var domains = {
  "domain": "example.inc",
  "main": "http://local.example.inc:4000",
  "my": "http://mylocal.example.inc:4000",
  "pay": "http://paylocal.example.inc:4000",
  'mall': 'http://localmall.example.inc:4008',
  'zc': 'http://localzc.example.inc:4009',
  'bx': 'http://localbx.example.inc:4010',
  'fund': 'http://localfund.example.inc:4011'
};
global.domains = domains;
global.domainUrl = function (path, branch) {
  var regHttp = /^(http|https):\/\//i;
  if (regHttp.test(path) || '' == path || '#' == path) {
    return path;
  }
  if (domains) {
    if (domains && domains[branch]) {
      return domains[branch] + path;
    } else {
      return path;
    }
  } else {
    return path;//没有配置域名，直接返回
  }
};

global.redirect = {
  main: function (path) {
    var regHttp = /^(http|https):\/\//i;
    if (regHttp.test(path) || '' == path || '#' == path) {
      return path;
    }
    if (domains) {
      var regAccount = /^\/account/i;//个人中心
      var regRegister = /^\/register/i;//注册页
      var regLogin = /^\/login/i;//登陆页
      var regZcOrderPay = /^\/pay/i;//众筹支付

      if (regAccount.test(path) || regRegister.test(path) || regLogin.test(path)) {
        //个人中心、注册页、登陆页使用my域名
        return domains.my + path;
      } else if (regZcOrderPay.test(path)) {
        return domains.pay + path;
      } else {
        //其它都使用主域名
        return domains.main + path;
      }
    } else {
      return path;//没有配置域名，直接返回
    }
  },
  mall: function (path) {
    return domainUrl(path, 'mall');
  },
  zc: function (path) {
    return domainUrl(path, 'zc');
  },
  bx: function (path) {
    return domainUrl(path, 'bx');
  },
  fund: function (path) {
    return domainUrl(path, 'fund');
  }
};
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
