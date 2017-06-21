const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var unirest = require('unirest');
var router = express.Router();
var async = require("async");
var unirest = require('unirest');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.124.137.105'
});

var accessKey = "f_PRhA427occkummIefOwe7JuZifKS2AM-VuLBRA4B9-ry8b_Ce8kPF_agGsCBBi";

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
				if(!req.session.key){
					console.log("session key : "+req.session.key);
					//로그인 X
					console.log("session key : 없음");
					if(!req.body.id || !req.body.name || !req.body.social_type || !req.body.push_token){
					//if(req.body.id == 0 || req.body.name == 0 || req.body.social_type == 0 || req.body.push_token == 0){
						callback(8,null);
					}else{
						var query = 'insert into user(id, name, profile_url,social_type,push_token) values (?,?,?,?,?);';
						var query_params = [req.body.id,req.body.name,req.body.profile_url,req.body.social_type,req.body.push_token];
						
						console.log("id : "+req.body.id);
						console.log("name : "+req.body.name);
						console.log("profile_url : "+req.body.profile_url);
						console.log("social_type : "+req.body.social_type);
						console.log("push_token : "+req.body.push_token);
						//회원 가입(post)
						connection.query(query, query_params, function (error, info) {
							if(error){
								//errno가 1062면 중복이란 소리(이미 있단 소리)
								console.log("errno : "+error.errno);
								if(error.errno == 1062){
									console.log("중복");
									//callback(10,null);
									
									//세션은 매번 저장하는 것이 아니라 한번만 저장하는 것
									req.session.key = req.body.id;
									callback(null, req.body.id);
								}
								else
									callback(11,null);
							}
							else{
								console.log("새로운 회원");
								
								unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
								.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
								.send({'event': '$set', 
									'entityType': 'user', 
									'entityId': req.body.id, 
									'eventTime': new Date().toISOString()})
								.end(function (response) {
								  if(response)
								    	console.log(response.body);
							      else
							            console.log("pio 생성 실패");
							
								});
								
								//세션은 매번 저장하는 것이 아니라 한번만 저장하는 것
								req.session.key = req.body.id;
								callback(null, req.body.id);
							}
						});
					}
				}else{
					console.log("session key : 이씀");
					//자동로그인
					callback(null, req.session.key);
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
			console.log("result id : "+results.id);
			console.log("result name : "+results.name);
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
	var query = 'insert into dressing_table(user_id, cosmetic_id, rate_num, review, status, expiration_date, purchase_date) values (?, ?, ?, ?, ?, ?, ?);';

	var moment = require('moment');
	var date = moment().format('YYYY-MM-DD');
	var newDate = moment(date).add(180, 'days').format('YYYY-MM-DD');

	var query_params = [req.params.user_id, req.body.id, null, req.body.review, 1, newDate ,date];
    connection.query(query, query_params, function (error, info) {
        if (error == null){
            unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
			.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
			.send({'event': 'own', 'entityType': 'user', 'entityId': req.params.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.product_name, 'eventTime': new Date().toISOString()})
			.end(function (response) {
			  console.log(response.body);
			  if(response)
			    	return res.status(message.code(1)).json(message.json(1));
		      else
		            return res.status(message.code(9)).json(message.json(9));
		
			});
        } else {
			console.log(error);
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
		var query = 'select id, brand, main_category, sub_category, product_name, img_src, cosmetic.rate_num from cosmetic, dressing_table where id in(select cosmetic_id from dressing_table where user_id = ?) and cosmetic.id = dressing_table.cosmetic_id';
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
	        } else {
				console.log(error);
				callback(11,null);
			}
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


router.get('/:user_id/cosmetics/only_use',function(req, res, next){

	console.log('-------------/:user_id/cosmetics-------------');
	console.log('<cookies>');
	console.log(req.cookies);
	console.log('sessionID : '+req.sessionID);
	console.log('<session>');
	console.log(req.session);

	if(req.params.user_id.length == 0){
		console.log("err1");
		res.status(message.code(4)).json(message.json(4)); return;
	}

	async.waterfall([
		function(callback){
			var queryflag = false;

			//DB에서 필요한 화장품 정보목록 가져오기
			var query = "select id, brand, main_category, sub_category, product_name, img_src, cosmetic.rate_num from cosmetic, dressing_table where id in(select cosmetic_id from dressing_table where user_id = ? and status = '1') and cosmetic.id = dressing_table.cosmetic_id";
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
					} else {
						callback(null, queryflag, null);
					}
				} else {
					console.log(error);
					callback(11,null);
				}
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

router.get('/:user_id/cosmetics/expiration_date/:push_interval', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
	
	var query = 'select id, brand, main_category, sub_category, product_name, img_src, cosmetic.rate_num, expiration_date from cosmetic, dressing_table where id in( select cosmetic_id from BeautyProject.dressing_table where DATE(expiration_date) <= DATE( DATE_ADD( NOW() ,INTERVAL ? DAY ) )) and cosmetic.id = cosmetic_id and user_id = ? order by expiration_date ASC';
	connection.query(query,[req.params.push_interval, req.params.user_id], function (error, cursor) {
	    if (error){
		    console.log(error);
			return res.status(message.code(11)).json(message.json(11)); return;
		}
			    
		if(cursor.length > 0){
			res.status(message.code(0)).json(cursor);
		}else res.status(message.code(9)).json(message.json(9));
	});
});


router.get('/:user_id/cosmetics/expiration_date/only_use/:push_interval', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var query = "select id, brand, product_name, img_src, expiration_date from cosmetic, dressing_table where id in( select cosmetic_id from BeautyProject.dressing_table where DATE(expiration_date) <= DATE( DATE_ADD( NOW() ,INTERVAL ? DAY ) ) and status = '1') and cosmetic.id = cosmetic_id and user_id = ? order by expiration_date ASC";
	connection.query(query,[req.params.push_interval, req.params.user_id], function (error, cursor) {
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

	connection.query('select * from cosmetic where id = ?;',[req.params.cosmetic_id], function (error, cursor) {
		if (error) {
			console.log(error);
		}

		if(cursor.length > 0){
			res.status(message.code(0)).json(cursor[0]);
		}else {
			res.status(message.code(11)).json(message.json(11));
		}
	});
});


router.get('/dressing_table/:user_id/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	connection.query('select * from dressing_table where user_id = ? and cosmetic_id = ?;',[req.params.user_id, req.params.cosmetic_id], function (error, cursor) {
		if (error) {
			console.log(error);
		}

		if(cursor.length > 0){
			if(cursor[0]['status'] == 1){
				cursor[0]['status'] = true;
			}else{
				cursor[0]['status'] = false;
			}
			res.status(message.code(0)).json(cursor);
		}else {
			res.status(message.code(0)).json(cursor);
		}
	});
});

router.put('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var flag = false;
	var query = 'update dressing_table set' + '';
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
	/*
		flag = true;
		query_params.push(req.body.status);
		if(query_params.length > 1) query += ' ,';
		query += ' status = ?';

		console.log("req.body.status : " + req.body.status);
		*/
	// }
	if(req.body.expiration_date){
		flag = true;
		query_params.push(req.body.expiration_date);
		if(query_params.length > 1) query += ' ,';
		query += ' expiration_date = ?';
	}
	if(req.body.purchase_date){
		flag = true;
		query_params.push(req.body.purchase_date);
		if(query_params.length > 1) query += ' ,';
		query += ' purchase_date = ?';
	}

	query += ' where user_id = ? and cosmetic_id = ?;';
	query_params.push(req.params.user_id);
	query_params.push(req.params.cosmetic_id);

	if(flag == false){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	console.log("query : " + query);
	console.log("query_params : " + query_params);


	connection.query(query, query_params, function (error, info) {
        if (error == null){
            return res.status(message.code(0)).json(message.json(0));
        } else {
			console.log("error : " + error);
            return res.status(message.code(11)).json(message.json(11));
 		}
    });
});

router.post('/cosmetics/:stat', function(req, res, next) {
	if(req.body.user_id.length == 0 || req.body.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var query = "insert into dressing_table (rate_num,review,expiration_date,purchase_date,user_id,cosmetic_id,status) values (?,?,?,?,?,?,?);"
	var query_params = [req.body.rate_num, req.body.review, req.body.expiration_date, req.body.purchase_date, req.body.user_id, req.body.cosmetic_id, req.params.stat];


	connection.query(query, query_params, function (error, info) {
		if (error == null){ // 최초 등록인 경우
			console.log("query : " + query);
			console.log("query_params : " + query_params);

			//여기서부터는 'select'로 해당 cosmetic 정보 찾고, 'update'로 그 cosmetic 정보에 (rate_num+cur.rate_num)/(rate_people+1), rate_people+=1해서 update.

			query = "select rate_num, rate_people from cosmetic where id = ?";
			query_params = [req.body.cosmetic_id]

			connection.query(query, query_params, function(error,info){
				if(error == null & info.length != 0){
					query = "update cosmetic set rate_num = ?, rate_people = ? where id = ?";
					var rate_people = info[0].rate_people + 1;
					var rate_num = info[0].rate_num + req.body.rate_num;
					rate_num = rate_num / rate_people;

					query_params = [rate_num.toFixed(2), rate_people, req.body.cosmetic_id]

					connection.query(query, query_params, function(error,info){
						if(error == null){
							console.log("query : " + query);
							console.log("query_params : " + query_params);

							//화장품 학습 - 별점 등록
						  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
							.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
							.send({'event': 'rate', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic_name, 'properties' : { 'rating' : req.body.rate_num },'eventTime': new Date().toISOString()})
							.end(function (response) {
							  console.log(response.body);
							  if(response)
							    	return res.status(message.code(1)).json(message.json(1));
						      else
						            return res.status(message.code(9)).json(message.json(9));
						
							});
						}else{
							console.log("error : " + error);
							return res.status(message.code(11)).json(message.json(11));
						}

					});
				}else{
					console.log("error : " + error);
					return res.status(message.code(11)).json(message.json(11));
				}

			});

		} else { //기존 등록했던 경력이 있고, 수정하는 경우
			if(error.code == "ER_DUP_ENTRY"){ //이미 존재
				//여기서부터는 'select'로 dressing_table의 해당 user의 해당 rate_num(=> prev_rate_num)을 찾고.
				query = "select rate_num from dressing_table where cosmetic_id = ? and user_id = ?";
				query_params = [req.body.cosmetic_id, req.body.user_id]

				connection.query(query, query_params, function(error,info) {
					if (error == null & info.length != 0) {
						var prev_rate_num = info[0].rate_num;
						var flag = false;
						var query = 'update dressing_table set' + '';
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
						if(req.params.stat) {
                            //안드로이드에서 status 0 으로 수정해서 post 날리면 !req.body.status 인걸로 인식하길래..
							 flag = true;
							 query_params.push(req.params.stat);
							 if(query_params.length > 1) query += ' ,';
							 query += ' status = ?';

							 console.log("req.params.stat : " + req.params.stat);
                        }
						if(req.body.expiration_date){
							flag = true;
							query_params.push(req.body.expiration_date);
							if(query_params.length > 1) query += ' ,';
							query += ' expiration_date = ?';
						}
						if(req.body.purchase_date){
							flag = true;
							query_params.push(req.body.purchase_date);
							if(query_params.length > 1) query += ' ,';
							query += ' purchase_date = ?';
						}

						query += ' where user_id = ? and cosmetic_id = ?;';
						query_params.push(req.body.user_id);
						query_params.push(req.body.cosmetic_id);

						if(flag == false){
							res.status(message.code(13)).json(message.json(13)); return;
						}


						connection.query(query, query_params, function (error, info) {
							if (error == null){
								console.log("query : " + query);
								console.log("query_params : " + query_params);

								query = "select rate_num, rate_people from cosmetic where id = ?";
								query_params = [req.body.cosmetic_id]

								connection.query(query, query_params, function(error,info){
									if(error == null & info.length != 0){

										//여기서부터는 'select'로 해당 cosmetic 정보 찾고, 'update'로 그 cosmetic 정보에 (rate_num - prev_rate_num + cur.rate_num)/(rate_people), (rate_people은 그대로)해서 update.
										query = "update cosmetic set rate_num = ?, rate_people = ? where id = ?";
										console.log("info[0].rate_num : " + info[0].rate_num);
										console.log("prev_rate_num : " + prev_rate_num);
										console.log("req.body.rate_num : " + req.body.rate_num);

										if(info[0].rate_num == null)
                                            info[0].rate_num = 0;
										if(prev_rate_num == null)
											prev_rate_num = 0;

                                        var rate_people;
										if(info[0].rate_num == 0){
											rate_people = info[0].rate_people+1;
										}else{
                                            rate_people = info[0].rate_people;
										}
										var rate_num = info[0].rate_num - prev_rate_num + req.body.rate_num;

                                        console.log("rate_num2 : " + rate_num);
                                        console.log("info[0].rate_num : " + info[0].rate_num);
                                        console.log("prev_rate_num : " + prev_rate_num);
                                        console.log("req.body.rate_num : " + req.body.rate_num);


                                        rate_num = rate_num / rate_people;

										query_params = [rate_num.toFixed(2), rate_people, req.body.cosmetic_id]

										connection.query(query, query_params, function(error,info){
											if(error == null){
												console.log("query : " + query);
												console.log("query_params : " + query_params);

												//화장품 학습 - 별점 등록
											  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
												.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
												.send({'event': 'rate', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic_name, 'properties' : { 'rating' : req.body.rate_num },'eventTime': new Date().toISOString()})
												.end(function (response) {
												  console.log(response.body);
												  if(response)
												    	return res.status(message.code(1)).json(message.json(1));
											      else
											            return res.status(message.code(9)).json(message.json(9));
											
												});
											}else{
												console.log("error : " + error);
												return res.status(message.code(11)).json(message.json(11));
											}

										});
									}else{
										console.log("error : " + error);
										return res.status(message.code(11)).json(message.json(11));
									}

								});
							} else {
								console.log("error : " + error);
								return res.status(message.code(11)).json(message.json(11));
							}
						});
					}else{
						console.log("error : " + error);
						return res.status(message.code(11)).json(message.json(11));
					}
				});



			}else{
				return res.status(message.code(11)).json(message.json(11));
			}

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
	try {
		var img = fs.readFileSync('./public/images/users/' + filename);
	} catch (err) {
		if (err.code !== 'ENOENT')
			throw err;

	}
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});

router.get('/images/skin_type/:filename', function(req, res) {

	req.session.destroy(function(err){
		if(err) res.status(message.code(14)).json(message.json(14));
	});

	var filename = req.params.filename;
	var img = fs.readFileSync('./public/images/skin_type/' + filename);
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});


router.get('/images/skin_trouble/:filename', function(req, res) {

	req.session.destroy(function(err){
		if(err) res.status(message.code(14)).json(message.json(14));
	});

	var filename = req.params.filename;
	var img = fs.readFileSync('./public/images/skin_trouble/' + filename);
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

//토큰값 보내기
router.put('/token', function(req, res, next){
	console.log('-------------/:user_id/token-------------');
	var query = 'update user SET push_token = ? WHERE id = ?';
	var query_params = [req.body.push_token,req.body.id];
	
	console.log("id : "+req.body.id);
	console.log("token : "+req.body.push_token);
	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(11)).json(message.json(11));
		}
		else{
			console.log("토큰값 재 저장 : "+req.body.push_token);
			res.status(message.code(1)).json(message.json(1));
			/*
			connection.query('select * from user where id = ?;', req.body.id, function (error, cursor) {
				if(error) res.status(message.code(11)).json(message.json(11));
				else return res.status(message.code(0)).json(cursor[0]);
			});
			*/
		}
	});
});


router.post('/follow/:follower_id/:followee_id', function(req, res, next) {
	if(req.params.follower_id == null || req.params.followee_id == null){
		return res.status(message.code(4)).json(message.json(4));
	}

	var query_check = "select * from follow where (follower_id = ? AND followee_id = ?);";
	connection.query(query_check, [req.params.follower_id, req.params.followee_id], function (error, info) {
		if (error == null){
			if(info.length ==0){ //팔로우 아직 안된 상태
				var now = new Date();
				var query = 'insert into follow(follower_id, followee_id, date) values (?, ?, ?);';
				var query_params = [req.params.follower_id, req.params.followee_id, now];
				connection.query(query, query_params, function (error, info) {
					if (error == null){
						return res.status(message.code(1)).json(message.json(1));
					} else {
						return res.status(message.code(10)).json(message.json(10));
					}
				});
			}else{ //팔로우 이미 되있는 상태
				var query = "delete from follow where (follower_id = ? AND followee_id = ?);";
				connection.query(query, [req.params.follower_id, req.params.followee_id], function (error, info) {
					if (error == null){
						return res.status(message.code(1)).json(message.json(3)); //deleted
					} else {
						return res.status(message.code(10)).json(message.json(10));
					}
				});
			}
		} else {

		}
	});
});



//유저리스트에서 내가 팔로윙하고있는 사람인지 확인하는 요청
router.get('/follow/:follower_id/:followee_id', function(req, res, next) {
	if(req.params.follower_id == null || req.params.followee_id == null){
		return res.status(message.code(4)).json(message.json(4));
	}

	var query_check = "select * from follow where (follower_id = ? AND followee_id = ?);";
	connection.query(query_check, [req.params.follower_id, req.params.followee_id], function (error, info) {
		if (error == null){
			if(info.length !=0 ){ //팔로우 이미 되있는 상태
				return res.status(message.code(1)).json(message.json(10)); //이미 되있는 상태
			}else {
				return res.status(message.code(1)).json(message.json(2)); //아직 되있지않은 상태
			}
		} else {

		}
	});
});


//화장대 페이지에서 팔로윙 / 팔로워 각각 몇명인지만 확인하는 요청
router.get('/follow_number/:user_id', function(req, res, next) {
	if(req.params.user_id == null){
		return res.status(message.code(4)).json(message.json(4));
	}

	var length = [];

	var query_following = "select * from follow where follower_id = ?;";
	connection.query(query_following, req.params.user_id, function (error, info) {
		if (error == null){
			//return res.status(message.code(1)).json(info.length); //이미 되있는 상태
			length.push(info.length);
		} else {
			return res.status(message.code(10)).json(message.json(10)); //이미 되있는 상태
		}
	});

	var query_followee = "select * from follow where followee_id = ?;";
	connection.query(query_followee, req.params.user_id, function (error, info) {
		if (error == null){
			//return res.status(message.code(1)).json(info.length); //이미 되있는 상태
			length.push(info.length);
			console.log("length : " + length);
			return res.status(message.code(1)).json(length);
		} else {
			return res.status(message.code(10)).json(message.json(10)); //이미 되있는 상태
		}
	});
});

//팔로잉 리스트
router.get('/load/following/:user_id', function(req, res, next) {
	if(req.params.user_id == null){
		return res.status(message.code(4)).json(message.json(4));
	}

	var query = "select * from user where id in (select followee_id from follow where follower_id = ?);";
	var query_params = req.params.user_id;

	console.log(query);
	console.log(query_params);


	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(10)).json(message.json(10));
		}
		else{
			return res.status(message.code(1)).json(info);
		}
	});
});

//팔로워 리스트
router.get('/load/follower/:user_id', function(req, res, next) {
	if(req.params.user_id == null){
		return res.status(message.code(4)).json(message.json(4));
	}

	var query = "select * from user where id in (select follower_id from follow where followee_id = ?);";
	var query_params = req.params.user_id;

	console.log(query);
	console.log(query_params);


	connection.query(query, query_params, function (error, info) {
		if(error){
			console.log(error);
			return res.status(message.code(9)).json(message.json(9));
		}
		else{
			return res.status(message.code(1)).json(info);
		}
	});
});


//닉네임 중복체크
router.get('/check/:name', function(req, res, next){
	if(req.params.name == null) return res.status(message.code(4)).json(message.json(4));
	
	var query = "select * from user where nickname = ?;";
	var query_params = req.params.name;
	
	connection.query(query, query_params, function (error, cursor) {
		if (error) callback(11, results);
		
		if(cursor.length > 0){
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(0)).json(message.json(0));
		}
	});
});


router.post('/image/:filename', function(req, res, next) {
  upload(req, res).then(function (file) {
    res.json(file);
  }, function (err) {
    res.send(500, err);
  });
});



router.post('/cosmetic/rate', function(req, res, next){
	if(req.body.user_id == null || req.body.cosmetic_id == null || req.body.rate_num == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'update dressing_table SET rate_num = ? WHERE (user_id = ? AND cosmetic_id = ?)';
	var query_params = [req.body.rate_num, req.body.user_id, req.body.cosmetic_id];
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			var cur_rate_num;
			var cur_rate_people;

			query = 'select rate_num, rate_people from cosmetic where id = ?';
			query_params = [req.body.cosmetic_id];


			connection.query(query, query_params, function(error, info){
				if(error){
					console.log(error);
					return res.status(message.code(9)).json(message.json(9));
				}
				else{
					cur_rate_people = info[0].rate_people+1;
					cur_rate_num = (info[0].rate_num + parseFloat(req.body.rate_num))/(parseInt(cur_rate_people));

					query = 'update cosmetic SET rate_num = ?, rate_people = ? WHERE id = ?';

					query_params = [cur_rate_num, cur_rate_people, req.body.cosmetic_id];
					connection.query(query, query_params, function(error, info){
						if(error){
							console.log(error)
							res.status(message.code(9)).json(message.json(9));
						}else{
							res.status(message.code(0)).json(message.json(0));
						}
					});
				}
			});


		}
	});
});



router.get('/match/user/:user_id', function(req, res, next){
	if(req.params.user_id == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'select skin_type from user where id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			query = 'select * from user where (skin_type = ? and id != ?) limit 3';
			query_params = [info[0].skin_type, req.params.user_id];

			connection.query(query, query_params, function(error, info){
				if(error){
					console.log(error);
					return res.status(message.code(9)).json(message.json(9));
				}
				else{
					res.status(message.code(0)).json(info);
				}
			});


		}
	});
});

//팔로워 갯수 불러오기
router.get('/get/follower/number/:user_id', function(req, res, next){
	if(req.params.user_id == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'select count(follower_id) as count from follow where followee_id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(0)).json(info);
		}
	});
});

//보유 화장품 갯수 불러오기
router.get('/get/cosmetic/number/:user_id', function(req, res, next){
	if(req.params.user_id == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'select count(user_id) as count from dressing_table where user_id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(0)).json(info);
		}
	});
});


router.get('/match/creator/:user_id', function(req, res, next){
	if(req.params.user_id == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'select skin_type from user where id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			query = 'select * from youtuber where (skin_type = ? and id != ?) limit 3';
			query_params = [info[0].skin_type, req.params.user_id];

			connection.query(query, query_params, function(error, info){
				if(error){
					console.log(error);
					return res.status(message.code(9)).json(message.json(9));
				}else{
					res.status(message.code(0)).json(info);
				}
			});


		}
	});
});


router.get('/my_cosmetic_info/:user_id/:push_interval', function(req, res, next){
	if(req.params.user_id == null || req.params.push_interval == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	//get have_number
	var query = 'select count(*) as have_number from dressing_table where user_id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			var have_number = info[0].have_number;
			query = "select count(*) as expiration_soon from dressing_table where user_id = ? and expiration_date < ?";
			var moment = require('moment');
			var date = moment().format('YYYY-MM-DD');

			var newDate = moment(date).add(req.params.push_interval, 'days').format('YYYY-MM-DD');

			query_params = [req.params.user_id, newDate];

			connection.query(query, query_params, function(error, info){
				if(error){
					console.log(error);
					return res.status(message.code(9)).json(message.json(9));
				}else{
					var expiration_soon = info[0].expiration_soon;
					var info_list = [have_number, expiration_soon];
					res.status(message.code(0)).json(info_list);
				}
			});


		}
	});
});


router.put('/join', function(req, res, next){
	if(req.body.user_id == null || req.body.nickname == null || req.body.sex == null || req.body.birthyear == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	//get have_number
	var query = 'update user set gender = ?, birthyear = ?, nickname = ? where id = ?';
	var query_params = [req.body.sex, req.body.birthyear, req.body.nickname, req.body.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			query = 'select * from user where id = ?';
			query_params = [req.body.user_id];

			connection.query(query, query_params, function (error, info) {
				if (error){
					console.log(error);
					res.status(message.code(10)).json(message.json(10));
				}else{
					res.status(message.code(0)).json(info[0]);
				}
			});
		}
	});
});


router.get('/my_info/:user_id', function(req, res, next){
	if(req.params.user_id == null){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var query = 'select * from user where id = ?';
	var query_params = [req.params.user_id];

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(0)).json(info[0]);
		}
	});
});

router.post('/like/cosmetic', function(req, res, next) {
	if(req.body.user_id == null || req.body.cosmetic_id == null || req.body.cosmetic_name.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var moment = require('moment');
	var date = moment().format('YYYY-MM-DD');

	var query = "insert into like_cosmetic(user_id,cosmetic_id,like_date) values(?,?,?);";
	connection.query(query, [req.body.user_id, req.body.cosmetic_id, date], function (error, info) {
		if (error == null){
			//train - scrap cosmetic
			unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
			.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
			.send({'event': 'scrap', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic_name, 'eventTime': new Date().toISOString()})
			.end(function (response) {
			  console.log(response.body);
			  if(response)
			    	return res.status(message.code(0)).json(message.json(0));
		      else
		            return res.status(message.code(9)).json(message.json(9));
		
			});
		} else {
			res.status(message.code(10)).json(message.json(10));
		}
	});
});


router.post('/like/video', function(req, res, next) {
    if(req.body.user_id == null || req.body.id == null || req.body.title.length == 0 ){
        res.status(message.code(4)).json(message.json(4)); return;
    }

	var moment = require('moment');
	var date = moment().format('YYYY-MM-DD');

    var query = "insert into like_video(user_id,id,like_date) values(?,?,?);";
    connection.query(query, [req.body.user_id, req.body.id, date], function (error, info) {
        if (error == null){
            //train - scrap cosmetic
            unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
                .headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
                .send({'event': 'scrap', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'content', 'targetEntityId': req.body.title, 'eventTime': new Date().toISOString()})
                .end(function (response) {
                    console.log(response.body);
                    if(response)
                        return res.status(message.code(0)).json(message.json(0));
                    else
                        return res.status(message.code(9)).json(message.json(9));

                });
        } else {
        	console.log(error)
            res.status(message.code(10)).json(message.json(10));
        }
    });
});

router.post('/delete/like/cosmetic', function(req, res, next) {
	if(req.body.user_id == null || req.body.cosmetic_id == null || req.body.cosmetic_name.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var query = "delete from like_cosmetic where user_id = ? and cosmetic_id = ?;";
	connection.query(query, [req.body.user_id, req.body.cosmetic_id], function (error, info) {
		if (error == null){
			//train - scrap cosmetic
			unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
			.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
			.send({'event': 'cancle_scrap', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic_name, 'eventTime': new Date().toISOString()})
			.end(function (response) {
			  console.log(response.body);
			  if(response)
			    	return res.status(message.code(0)).json(message.json(0));
		      else
		            return res.status(message.code(9)).json(message.json(9));
		
			});
		} else {
			res.status(message.code(10)).json(message.json(10));
		}
	});
});

router.post('/delete/like/video', function(req, res, next) {
    if(req.body.user_id == null || req.body.id == null || req.body.title.length == 0 ){
        res.status(message.code(4)).json(message.json(4)); return;
    }

    var query = "delete from like_video where user_id = ? and id = ?;";
    connection.query(query, [req.body.user_id, req.body.id], function (error, info) {
        if (error == null){
            //train - scrap cosmetic
            unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
                .headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
                .send({'event': 'cancle_scrap', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'content', 'targetEntityId': req.body.title, 'eventTime': new Date().toISOString()})
                .end(function (response) {
                    console.log(response.body);
                    if(response)
                        return res.status(message.code(0)).json(message.json(0));
                    else
                        return res.status(message.code(9)).json(message.json(9));

                });
        } else {
            res.status(message.code(10)).json(message.json(10));
        }
    });
});


router.get('/like/cosmetic/:user_id/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id == null || req.params.cosmetic_id == null){
		res.status(message.code(4)).json(message.json(4));
	}

	var query = "select * from like_cosmetic where user_id = ? and cosmetic_id = ?;";
	connection.query(query, [req.params.user_id, req.params.cosmetic_id], function (error, info) {
		if (error == null){
			if(info.length == 0){
				res.status(message.code(10)).json(message.json(10));
			}else{
				res.status(message.code(0)).json(message.json(0));
			}
		} else {
			res.status(message.code(10)).json(message.json(10));
		}
	});
});


router.get('/like/video/:user_id/:id', function(req, res, next) {
	if(req.params.user_id == null || req.params.id == null){
		res.status(message.code(4)).json(message.json(4));
	}

	var query = "select * from like_video where user_id = ? and id = ?;";
	connection.query(query, [req.params.user_id, req.params.id], function (error, info) {
		if (error == null){
			if(info.length == 0){
				console.log("1");
				res.status(message.code(10)).json(message.json(10));
			}else{
				res.status(message.code(0)).json(message.json(0));
			}
		} else {
            console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}
	});
});


router.get('/like/cosmetic/:user_id', function(req, res, next) {
	if(req.params.user_id == null){
		res.status(message.code(4)).json(message.json(4));
	}
	var query = "select * from cosmetic where id in (select cosmetic_id from like_cosmetic where user_id = ?);";
	connection.query(query, [req.params.user_id], function (error, info) {
		if (error == null){
			res.status(message.code(0)).json(info);
		} else {
			res.status(message.code(10)).json(message.json(10));
		}
	});
});


router.get('/like/video/:user_id', function(req, res, next) {
	if(req.params.user_id == null){
		res.status(message.code(4)).json(message.json(4));
	}
//select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where description like ? LIMIT ?, ?
	var query = "select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where video.id in (select id from like_video where user_id = ?);";
	connection.query(query, [req.params.user_id], function (error, info) {
		if (error == null){
			res.status(message.code(0)).json(info);
		} else {
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}
	});
});



router.get('/status/cosmetic/:user_id/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id == null & req.params.cosmetic_id == null){
		res.status(message.code(4)).json(message.json(4));
	}
//select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where description like ? LIMIT ?, ?
	var query = "select status from dressing_table where user_id = ? and cosmetic_id = ?;";
	connection.query(query, [req.params.user_id,req.params.cosmetic_id], function (error, info) {
		if (error == null){
			if(info.length == 0){
				res.status(message.code(0)).json(0);
			}else{
				res.status(message.code(0)).json(info[0]['status']);
			}

		} else {
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}
	});
});


router.put('/status/cosmetic/:user_id/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id == null & req.params.cosmetic_id == null){
		res.status(message.code(4)).json(message.json(4));
	}
//select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where description like ? LIMIT ?, ?
	var query = "update dressing_table set status = !status where user_id = ? and cosmetic_id = ?;";
	connection.query(query, [req.params.user_id], function (error, info) {
		if (error == null){
			res.status(message.code(0)).json(message.json(0));
		} else {
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}
	});
});

module.exports = router;

