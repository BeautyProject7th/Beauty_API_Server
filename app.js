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

var deeplink = require('./routes/deeplink');
var category = require('./routes/category');
var brand = require('./routes/brand');
var users = require('./routes/users');
var cosmetics = require('./routes/cosmetics');
var video = require('./routes/video')
var youtuber = require('./routes/youtuber')


//fcm
var cron = require('node-cron');
var mysql = require('mysql');
var FCM = require('fcm-push');
var async = require('async');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: '1@%24^%$3^*&98&^%$',
	store: new RedisStore({
        host: "localhost",
        port: 6379,
        client: redis,
        prefix : "session:",
        db : 0,
    }),
    saveUninitialized: true,//세션 아이디를 실제 사용하기전에는 발급하지 않음
    resave: false, //세션 아이디를 접속할때마다 새롭게 발급하지 않음
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 // 쿠키 1년 유지
    }
}));

app.use('/deeplink', deeplink);


app.use('/category', category);
app.use('/brand', brand);
app.use('/users', users);
app.use('/cosmetics', cosmetics);
app.use('/video', video);
app.use('/youtuber', youtuber);


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
  //res.render('error');
});

module.exports = app;

app.listen(8888);

console.log("port 8888 server running....");


// 개인정보 취급방침
app.get('/privacy_rule', function (req, res) {
    fs.readFile('public/privacy_rule.html', function (error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

// 이용약관
app.get('/agreement', function (req, res) {
    fs.readFile('public/agreement.html', function (error, data) {
        if (error) {
            console.log(error);
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        }
    });
});

/* fcm */

var serverKey = 'AAAAiF04B24:APA91bHVabupccjcuHjmah4iaOwY2TfBdk10LbgdRQT9WEkEAyIY60FZUWIMQ4X6TKguvP3YsWI3aGJMhgGuPGtmd1HMZJxhAeO3ui0GWEFkpUP-f8-uYMu7E0lVqNlBssKbnU9YHvQK '; 
var fcm = new FCM(serverKey); 

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.124.137.105'
});


/* 화장품 명까지 보내주는 방법
	문제점 : 한 사람에게 2개 이상의 제품 알람이 가지 않음 ( 2개이상일때 1개만 가짐 )
			화장품 명이 너무 길어서 지저분 함
			
var task = cron.schedule('7 15 * * *', function() {
  console.log('immediately started');
  //1. 하루에 한번씩 ( 우선 저녁 6시 정도 )
  
  //나중에는 설정에서 날짜 설정할 수 있도록 하기
  //나는 당일이나 전날에 알려주면 된다는 생각을 했는데
  //의견을 물어보니 2~3일 전에는 알려줘야 미리 구매한다는 의견도 있었음 그냥 다 설정하게 하는게 좋을 듯
  
  //우선은 내일이 유통기한 마지막날인 경우
  //2. 일단 내일이 유통기한인 등록된 화장품들을 다 가져온다.
  connection.query("select * from dressing_table where expiration_date = CURDATE() + INTERVAL 1 DAY", function (error, cursor) {
		if (error){
	        console.log("select expiration server error");
	    }
	        
		if (cursor.length > 0) {
	        console.log("내일이 유통기한 제품이 있네요");
			for (var i = 0; i < cursor.length; i++) {
						var cosmetic_id = cursor[i].cosmetic_id;
						console.log("cosmetic_id : "+cosmetic_id);
						var user_id = cursor[i].user_id;
						console.log("original user_id : "+user_id);
				async.parallel([
					function(callback){
						//4.유저 이름, 토큰 값 가져오기
						console.log("second user_id : "+user_id);
						connection.query("select * from user where id = ?", user_id, function (error, users) {
							if (error){
						        console.log("select user_name server error");
							}
							if (users.length > 0) {
								var user_name = users[0].name;
								var user_token = users[0].push_token;
								console.log("user_name : "+user_name);
								console.log("user_token : "+user_token);
								callback(null,[user_name,user_token]);
							}
						});
					},
					function(callback){
						//3.화장품 명 찾기
						connection.query("select * from cosmetic where id = ?", cosmetic_id, function (error, cosmetics) {
							if (error){
						        console.log("select cosmetic_name server error");
							}
							if (cosmetics.length > 0) {
								var cosmetic_name = cosmetics[0].product_name;
								console.log("cosmetic_name : "+cosmetic_name);
								callback(null,cosmetic_name);
							}
						});
					}
					],
	            function(err,results){
	                if(err) console.log(err);
	                else{
		                var cosmetic_name = results[1];
		                var user_name = results[0][0];
		                var user_token = results[0][1];
						console.log("--------푸시보내보자-------");
						console.log("cosmetic_name : "+cosmetic_name);
						console.log("user_name : "+user_name);
						console.log("user_token : "+user_token);
						console.log("------------------------");
						
						//5.보낼 메시지 설정
						var message = { 
							to: user_token, 
							collapse_key: "score_update",
							data: { cosmetic_id : cosmetic_id }, 
							notification: { 
								title: cosmetic_name, 
								body: user_name+'님의 화장품 유통기한이 하루 남았습니다!' 
							} 
						};
						//6.푸시 보내기
						fcm.send(message, function(err, response){ 
							if (err) { 
								console.log("Something has gone wrong!"); 
								console.log(err);
							} else { 
								console.log("Successfully sent with response: ", response); 
							} 
						});
					}
	            });
			}
		}
	});
});
*/

var task = cron.schedule('57 23 * * *', function() {
  //시간 설정가능하도록 구현할 것
  //하루전에는 그냥 디폴트로
  connection.query("select * from dressing_table where (expiration_date = CURDATE() + INTERVAL 7 DAY or expiration_date = CURDATE() + INTERVAL 1 DAY) and status = true", function (error, cursor) {
		if (error){
	        console.log("select expiration server error");
	    }
	        
		if (cursor.length > 0) {
	        console.log("내일이 유통기한 제품이 있네요");
			for (var i = 0; i < cursor.length; i++) {
				var cosmetic_id = cursor[i].cosmetic_id;
				console.log("cosmetic_id : "+cosmetic_id);
				var user_id = cursor[i].user_id;
				console.log("original user_id : "+user_id);
				var date_str = String(cursor[i].expiration_date).substring(8, 10);
				var expiration_date = parseInt(date_str);
				
				async.parallel([
					function(callback){
						//유통기한 날짜 텍스트 보내기
						
						//현재 날짜 가져오기
						var today = new Date();
						var today_date = String(today.getDate() + 1);
						
						var title_txt = "[메화] 유통기한 7일 전";
		                //하루 전 일 경우
		                console.log('today_date : '+today_date);
		                console.log('expiration_date : '+expiration_date);
						if(today_date==expiration_date){
							title_txt = "[메화] 유통기한 1일 전";
						}
						
						callback(null,title_txt);
					},
					function(callback){
						console.log("second user_id : "+user_id);
						console.log("second exp : "+expiration_date);
						connection.query("select * from user where id = ?", user_id, function (error, users) {
							if (error){
						        console.log("select user_name server error");
							}
							if (users.length > 0) {
								var user_name = users[0].name;
								var user_token = users[0].push_token;
								
								console.log("user_name : "+user_name);
								console.log("user_token : "+user_token);
								callback(null,[user_name,user_token]);
							}
						});
					}
				],
	            function(err,results){
	                if(err) console.log(err);
	                else{
		                
		                var user_name = results[1][0];
		                var user_token = results[1][1];
		                var title_txt = results[0];
						console.log("--------푸시보내보자-------");
						console.log("user_name : "+user_name);
						console.log("user_token : "+user_token);
						console.log("------------------------");
						
						//5.보낼 메시지 설정 ( data 넣은 이유 : data를 넣어야 비축소형이 되기 때문! )
						var message = { 
							to: user_token, 
							notification: { 
								title: title_txt, 
								body: user_name+'님 유통기한이 다 되어가는 제품이 있습니다.'
							},
							data: {
								title: title_txt
							}
						};
						//6.푸시 보내기
						fcm.send(message, function(err, response){ 
							if (err) { 
								console.log("Something has gone wrong!"); 
								console.log(err);
							} else { 
								console.log("Successfully sent with response: ", response); 
							} 
						});
					}
	            });
			}
		}
	});
});

task.start();