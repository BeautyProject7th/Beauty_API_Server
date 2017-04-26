var cron = require('node-cron');
var mysql = require('mysql');
var FCM = require('fcm-push');
var async = require('async');

var serverKey = 'AAAAiF04B24:APA91bHVabupccjcuHjmah4iaOwY2TfBdk10LbgdRQT9WEkEAyIY60FZUWIMQ4X6TKguvP3YsWI3aGJMhgGuPGtmd1HMZJxhAeO3ui0GWEFkpUP-f8-uYMu7E0lVqNlBssKbnU9YHvQK '; 
var fcm = new FCM(serverKey); 

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.112.190.217'
});

var task = cron.schedule('26 14 * * *', function() {
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
						console.log(cursor[i]);
						var user_id = cursor[i].user_id;
						console.log("user_id : "+user_id);
				async.series([
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
					},
					function(callback){
						//4.유저 이름, 토큰 값 가져오기
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
		                var cosmetic_name = results[0];
		                var user_name = results[1][0];
		                var user_token = results[1][1];
						console.log("--------푸시보내보자-------");
						console.log("cosmetic_name : "+cosmetic_name);
						console.log("user_name : "+user_name);
						console.log("user_token : "+user_token);
						console.log("------------------------");
						
						//5.보낼 메시지 설정
						var message = { 
							to: user_token, 
							//collapse_key: cosmetic_name,
							data: { cosmetic_id : cosmetic_id }, 
							notification: { 
								title: cosmetic_name, 
								body: '유통기한이 하루 남았습니다!' 
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
