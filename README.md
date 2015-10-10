# dot
node.js dot template,expend use include embed some .def files , and use cache ,expire. express 4.x.x support.

##How to use?

    var dot = require('dot-extend');
    
    app.set('views', settings.views_dir);      
    app.set('view engine', 'dot');      
    app.engine('dot', dot.__express({  
        path: app.get('views'),  
        cache: true  //use cache
    })); 
    
    
## index.dot
    <!DOCTYPE html>
    <html>

    {{#def._include('header')}}

    <body>

    This is content.{{=it.content}}
    <br>

    {{#def._include('sub/hello')}}

    {{#def._include('footer')}}

    </body>
    </html>

or you can use like this get common code block.

    {{#def.footer}}

but has sub folder must be use def._include function .
##header.def

    <head lang="en">
        <meta charset="UTF-8">
        <title>{{=it.title}}</title>
    </head>
    
##footer.def
    
    <br>
    This is footer block.
    
## folder list
dot is engine,def is code block or common code segment.  

    views  
        sub  
            test.dot  
            hello.def  
        index.dot  
        header.def  
        footer.def  
`

## express route
render name only use .dot file.
    
    app.get('/index', function (req, res, next) {
        res.render('index', {title: 'index template', content: 'index doT content render'});
    });
    
    app.get('/test', function (req, res, next) {
        res.render('sub/test', {title: 'test template', content: 'test doT content render'});
    });
