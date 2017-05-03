const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var async = require("async");

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.112.190.217'
});

//
router.post('/login', function(req, res, next){
	console.log('-------------/login-------------');
	console.log('<cookies>');
	console.log(req.cookies);
	console.log('sessionID : '+req.sessionID);
	/*
	 어플에서 로그아웃 한 경우 세션값이 없어져서 다시 로그인 할때 세션으로 접근 가능하지만
	 어플을 삭제하고 다시 설치한 경우에는 세션이 바뀐다.
	 즉, 세션으로만 로그인 처리하는 방식은 로그아웃을 따로 하지 않고 재설치 한 경우 로그인이 되지 않는 문제 발생
	 하지만, 빠른 로그인 처리 및 기존 포맷을 사용하기 위해선 세션을 위한 로그인을 유지해야한다.
	 그래서 회원가입시 중복 문제가 발생한 경우가 회원가입은 했었지만, 세션 값이 바뀐 경우이므로
	 이 경우에는 세션을 새로 저장하는 방식으로 진행할 예정 ( 미해결 문제 : 기존 세션 데이터에 그대로 남아있음 )
	 */

	async.waterfall([
		function(callback){
			if (!req.session) {
				console.log('not connect session'); // handle error
				callback(14,null);
			}else{
				if(req.cookies['connect.sid']){
					console.log("쿠키있어");
					callback(null, req.session.key);
				}else{
					console.log("쿠키없어");

					//body값 있는지 확인
					if(req.body.id.length == 0 || req.body.name.length == 0 || req.body.social_type == 0 || req.body.push_token.length == 0){
						callback(13,null);
					}

					var query = 'insert into user(id, name, profile_url,social_type,push_token) values (?,?,?,?,?);';
					var query_params = [req.body.id,req.body.name,req.body.profile_url,req.body.social_type,req.body.push_token];

					//회원 가입(post)
					connection.query(query, query_params, function (error, info) {
						if(error){
							//errno가 1062면 중복이란 소리(이미 있단 소리)
							console.log(error.errno);
							if(error.errno == 1062){
								console.log("중복");
								//callback(10,null);
								callback(null, req.body.id);
							}
							else
								callback(11,null);
						}
						else{
							console.log("새로운 회원");
							callback(null, req.body.id);
						}
					});
				}
			}
		},
		function(id, callback){
			console.log("id : "+id);
			//유저 정보 찾기
			connection.query('select * from user where id = ?;', id, function (error, cursor) {
				if(error) callback(9,null);
				else callback(null, cursor[0]);
			});

		}
	], function (err, results) {
		if(err) res.status(message.code(err)).json(message.json(err));
		else{
			//세션은 매번 저장하는 것이 아니라 한번만 저장하는 것
			req.session.key = req.body.id;
			res.status(message.code(1)).json(results);
		}
	});
});

router.get('/logout',function(req, res, next){
	//기기마다 다른 세션이 저장되기 때문에 정확히 로그아웃 된다고 함
	console.log("get id : "+req.session.key);
	req.session.destroy(function(err){ 
		if(err) res.status(message.code(11)).json(message.json(11));
		else res.status(message.code(0)).json(message.json(0));
	});
});

router.get('/:id', function(req, res, next) {
	console.log('-------------/:id-------------');
	console.log('<cookies>'); 
	console.log(req.cookies);
	console.log('sessionID : '+req.sessionID);
	console.log('<session>');
	console.log(req.session);
	if(req.session.key)
		console.log("get id : "+req.session.key.toString());
	connection.query('select * from user where id = ?;',[req.params.id], function (error, cursor) {
		if (error) res.status(message.code(11)).json(message.json(11));
		
		if (cursor.length > 0) {
			res.status(message.code(0)).json(cursor[0]);
		}else res.status(message.code(9)).json(message.json(9));
    });
});

router.post('/:user_id/cosmetics', function(req, res, next) {
	
	if(req.params.user_id.length == 0){
		return res.status(message.code(4)).json(message.json(4));
	}	
	if(req.body.id.length == 0){
		return res.status(message.code(13)).json(message.json(13));
	}	
	var query = 'insert into dressing_table(user_id, cosmetic_id, rate_num, review, status) values (?, ?, ?, ?, ?);';
	var query_params = [req.params.user_id, req.body.id, req.body.rate_num, req.body.review, req.body.status];
    connection.query(query, query_params, function (error, info) {
        if (error == null){
            return res.status(message.code(1)).json(message.json(1));
        } else {
            return res.status(message.code(10)).json(message.json(10));		}
    });
});

router.get('/:user_id/cosmetics',function(req, res, next){
	
	console.log('-------------/:user_id/cosmetics-------------');
	console.log('<cookies>'); 
	console.log(req.cookies);
	console.log('sessionID : '+req.sessionID);
	console.log('<session>');
	console.log(req.session);
	
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
	
	async.waterfall([
	  function(callback){
		var queryflag = false;
		
		//DB에서 필요한 화장품 정보목록 가져오기
		var query = 'select id, brand, main_category, sub_category, product_name, img_src, rate_num from cosmetic, dressing_table where id in(select cosmetic_id from dressing_table where user_id = ?) and cosmetic.id = dressing_table.cosmetic_id';
		var query_params = [req.params.user_id];
		
		if(req.query.main){
            query += ' and main_category = ?';
            query_params.push(req.query.main);
        }
        if(req.query.sub){
	        if(!req.query.main) callback(6,null);
            query += ' and sub_category = ?';
            query_params.push(req.query.sub);     
        }
        if(query_params.length == 1){
	        query += ' ORDER BY main_category';
	        queryflag = true;
        }else{
	        //query 있는 경우 page필수 입력사항
	        if(!req.query.page)callback(5,null);
	        //별점 순 등등(추후 옵션)
	        query += ' ORDER BY rate_num desc';
	        query += " limit ?,20";
			//page 시작 0 부터로 해놓았는데 오빠가 1부터가 편하다고 하시면 req.query.page-1로 변경할 것
	        query_params.push((req.query.page-1)*20);
        }
		
		connection.query(query, query_params, function (error, cursor) {
	        if (error == null){

	            if (cursor.length > 0) {
					console.log("cursor.length : " + cursor.length);
					callback(null, queryflag, cursor);
				} else callback(9,null);
	        } else callback(11,null);
	    });
	  },
	  function(queryflag, cosmetics, callback){
		if(queryflag == true){
		    //querystring 안들어온 경우 4개씩만 보냄
		    var count = 1;
		    var before = ".";
		    var results = cosmetics.filter(function (item) {
			    var flag = false;
			    if(before == item.main_category){
				    if(count<4){
					    flag = true;
					    count += 1;
				    }
			    }else{
				    count = 1;
				    flag = true;
			    }
			    before = item.main_category;
				return flag;
			});
		    callback(null, results);
	    }else{
		    callback(null, cosmetics);
	    }
	  }
	], function (err, results) {
		if(err) res.status(message.code(err)).json(message.json(err));
		else res.status(message.code(0)).json(results);
	});	
});

router.get('/:user_id/cosmetics/expiration_date', function(req, res, next) {	
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
	
	var query = 'select id, brand, main_category, sub_category, product_name, img_src, rate_num, expiration_date from cosmetic, dressing_table where id in( select cosmetic_id from BeautyProject.dressing_table where DATE(expiration_date) <= DATE( DATE_ADD( NOW() ,INTERVAL 30 DAY ) ) and status = true ) and cosmetic.id = cosmetic_id and user_id = ? order by expiration_date ASC';
	connection.query(query,[req.params.user_id], function (error, cursor) {
	    if (error){
		    console.log(error);
			return res.status(message.code(11)).json(message.json(11)); return;
		}
			    
		if(cursor.length > 0){
			res.status(message.code(0)).json(cursor);
		}else res.status(message.code(9)).json(message.json(9));
	});
});

router.get('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
		
	async.waterfall([
	    function (callback) {
	        connection.query('select * from dressing_table where user_id = ? and cosmetic_id = ?;',[req.params.user_id, req.params.cosmetic_id], function (error, cursor) {
		        if (error) callback(11, results);
		        
				if(cursor.length > 0){
					var temp = [];
					temp.push(cursor[0].rate_num);
					temp.push(cursor[0].review);
					temp.push(cursor[0].status);
					temp.push(cursor[0].expiration_date);

					callback(null,temp);
				}else callback(4,null);
			});
	    },
	    function (temp, callback) {
		    connection.query('select * from cosmetic where id = ?;',[req.params.cosmetic_id], function (error, cursor) {
			    if (error) callback(11, results);
			    
				if(cursor.length > 0){
					cursor[0].expiration_date = temp.pop();
					cursor[0].status = temp.pop();
					cursor[0].review = temp.pop();
					cursor[0].rate_num = temp.pop();
					callback(null,cursor[0]);
				}else callback(4,null);
			});
		}
	],
	function (err, result) {
	    if(err) res.status(message.code(err)).json(message.json(err));
	    else res.status(message.code(0)).json(result);
	});
});

router.put('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
	
	var flag = false;
	var query = 'update dressing_table set';
	var query_params = [];
	
	if(req.body.rate_num){
		flag = true;
		query_params.push(req.body.rate_num);
		query += ' rate_num = ?';
	}
	if(req.body.review){
		flag = true;
		query_params.push(req.body.review);
		if(query_params.length > 1) query += ' ,';
		query += ' review = ?';
	}
	// if(req.body.status){
	//안드로이드에서 status 0 으로 수정해서 post 날리면 !req.body.status 인걸로 인식하길래..
		flag = true;
		query_params.push(req.body.status);
		if(query_params.length > 1) query += ' ,';
		query += ' status = ?';

		console.log("req.body.status : " + req.body.status);
	// }
	if(req.body.expiration_date){
		flag = true;
		query_params.push(req.body.expiration_date);
		if(query_params.length > 1) query += ' ,';
		query += ' expiration_date = ?';
	}
	
	query += ' where user_id = ? and cosmetic_id = ?;';
	query_params.push(req.params.user_id);
	query_params.push(req.params.cosmetic_id);
	
	if(flag == false){
		res.status(message.code(13)).json(message.json(13)); return;
	}
	
	console.log(query);
	
	connection.query(query, query_params, function (error, info) {
        if (error == null){
            return res.status(message.code(0)).json(message.json(0));
        } else {
            return res.status(message.code(11)).json(message.json(11));
 		}
    });
});

router.delete('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
	
	connection.query('delete from dressing_table where user_id = ? and cosmetic_id = ? ;',[req.params.user_id, req.params.cosmetic_id], function (error, info) {
        if (error == null) {
           res.status(message.code(2)).json(message.json(2));
        } else res.status(message.code(9)).json(message.json(9));
    });
});

router.get('/images/:filename', function(req, res) {	
	
	req.session.destroy(function(err){ 
		if(err) res.status(message.code(14)).json(message.json(14));
	});
	
	var filename = req.params.filename;
	var img = fs.readFileSync('./public/images/users/' + filename);
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});





//update skin_type
router.put('/skin_type', function(req, res, next){
	console.log('-------------/skin_type-------------');
	var query = 'update user SET skin_type = ? WHERE id = ?';
	var query_params = [req.body.skin_type,req.body.user_id];

	//스킨타입 변경
	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(10)).json(message.json(10));
		}
		else{
			console.log(req.body.user_id +"님의 스킨타입이 "+ req.body.skin_type +"으로 변경 완료");
			return res.status(message.code(1)).json(message.json(1));
		}
	});
});

//update skin_trouble
router.put('/skin_trouble', function(req, res, next){
	console.log('-------------/skin_trouble-------------');
	var query = 'update user SET  skin_trouble_1 = ?,skin_trouble_2 = ?,skin_trouble_3 = ? WHERE id = ?';
	var query_params = [req.body.skin_trouble_1,req.body.skin_trouble_2,req.body.skin_trouble_3,req.body.user_id];
	//스킨트러블 변경
	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(10)).json(message.json(10));
		}
		else{
			console.log(req.body.user_id +"님의 피부 고민 변경 완료");
			return res.status(message.code(1)).json(message.json(1));
		}
	});
});


//find user's list
router.get('/find/:user_id', function(req, res, next){
	console.log('-------------/find/:user_id-------------');
	var query = "select * from user where id != ?";
	var query_params = [req.params.user_id];

	console.log(query);
	console.log(query_params);


	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(10)).json(message.json(10));
		}
		else{
			//console.log(info);
			return res.status(message.code(1)).json(info);
		}
	});
});


//find user's list search
router.get('/find/:user_id/search/:search_keyword', function(req, res, next){
	console.log('-------------/find/:user_id/search/:search_keyword-------------');
	var query = "select * from user where (id != ? and name like ?)";
	var query_params = [req.params.user_id, '%'+req.params.search_keyword+'%'];

	console.log(query);
	console.log(query_params);


	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(10)).json(message.json(10));
		}
		else{
			//console.log(info);
			return res.status(message.code(1)).json(info);
		}
	});
});

module.exports = router;

