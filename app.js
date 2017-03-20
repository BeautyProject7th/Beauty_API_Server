var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
//지금은 직접 켜야지만 가능 -> redis켜는법(필요할때만) 찾아볼 것
var redis = require('redis').createClient(6379,'localhost');

var category = require('./routes/category');
var brand = require('./routes/brand');
var users = require('./routes/users');
var cosmetics = require('./routes/cosmetics');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(session({
	store: new RedisStore({
        host: "localhost",
        port: 6379,
        client: redis,
        prefix : "session:",
        db : 0,
        resave : false
    }),
    secret: 'thakqbxl7',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 // 쿠키 1년 유지
    }
}));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/category', category);
app.use('/brand', brand);
app.use('/users', users);
app.use('/cosmetics', cosmetics);

app.use('/swagger-ui', express.static(path.join(__dirname, './node_modules/swagger-ui/dist')));
app.use('/v1/swagger.json', function(req, res) {
  res.json(require('./swagger.json'));
});
app.use('/swagger', function (req, res) {
  res.redirect('/swagger-ui?url=/v1/swagger.json');
});
/*
	http://13.112.190.217:8888/swagger-ui/?url=/v1/swagger.json
	위로 접속하면 rest api 쉽게 볼 수 있어용(테스트도 가능)
*/

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.listen(8888);

console.log("port 8888 server running....");
