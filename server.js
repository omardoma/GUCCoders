require('./api/data/dbconnection.js');
var express = require('express');
var app = express();
var routes = require("./api/routes");
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var favicon = require('serve-favicon');
var helmet = require('helmet');

app.set("port", 8080);
app.set('view engine', 'ejs');

app.use(helmet({
    noCache : true
}));
app.use(favicon(path.join(__dirname,'public','images','favicon.ico')));
app.use(session({
    secret: "dicvn18271hdsICVNo121291djckcfhiqwus928938293201duwvs",
    saveUninitialized: false,
    resave: false,
    cookie: {maxAge: 3600000*6}
}));

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '/public')));
app.use("/api", routes);

app.get("/", function (req, res) {
    res.redirect("/api/home");
});

app.get('*', function(req, res){
  res.status(404).render('pageNotFound');
});

app.post('*', function(req, res){
  res.status(404).render('pageNotFound');
});

var server = app.listen(app.get("port"), function () {
    
});