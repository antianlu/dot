# dot
node.js's dot.js template,expend use include embed some .def files , and use cache(static cache),express 4.x.x support.
    
## install
    npm install dot-extend

## How to use?

    var dot = require('dot-extend');

    var app = express();

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'dot');

	// config path params is templates path,you use array 		or string
	// Note that the path is order >=1.0.7
	app.engine('dot', dot.__express({
		path:[path.join(__dirname,'both'),app.get('views')],// or string(one path)
		cache: false// use static page,warming
	}));
	// Note the Chinese:
	// 1.0.7版本支持多路径模板，path配置可为数组（支持多路径指定）或字符串为一个路径下比如views，应为为完整路径。

    
## Note
    
If you are using. Def as a template file, the nested folders, to start from the most superior to find files    
如果使用.def作为模板文件时，嵌套文件夹的情况，要从最上级开始往下查找文件

    {{#def._include('sub1/test1')}} or sub1/test1.def

    def._include('../sub1/test1') // This is wrong

If you are using. The dot file as a nested template, please add. Dot suffix    
如果文件作为嵌套模板，请加上.dot后缀名

	{{#def._include('demo.dot')}}


    
## Advanced

Please see example senior use example, development and application in actual project.        
请查看example的高级使用列子,在实际项目中的开发应用   

## express route

render name must be use .dot file.
    
    app.get('/index', function (req, res, next) {
        res.render('index', {title: 'index template', content: 'index doT content render'});
    });
    
    app.get('/test', function (req, res, next) {
        res.render('sub/test', {title: 'test template', content: 'test doT content render'});
    });


#v1.1.5 fixed a bug

fixed use {{#def.demo}} get demo.def bug.
