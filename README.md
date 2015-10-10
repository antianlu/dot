# dot
node.js dot template,expend use include embed some .def files , and use cache ,expire. express 4.x.x support.

##How to use?

`
app.set('views', settings.views_dir);      
app.set('view engine', 'dot');      
app.engine('dot', dot.__express({  
    path: app.get('views'),  
    cache: true  
})); 
`
