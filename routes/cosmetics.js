const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var unirest = require('unirest');
var router = express.Router();
require('date-utils');

var accessKey = "f_PRhA427occkummIefOwe7JuZifKS2AM-VuLBRA4B9-ry8b_Ce8kPF_agGsCBBi";

fs = require('fs');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.124.137.105'
});

router.get('/', function(req, res, next) {
	console.log("id : "+req.session.key);
	
	//*예외처리 : req.query.page없을 경우!
	
	//일단 어떤 경우든 12개씩 리턴되게 만들어 놓았음
	//프로토타입에서는 이 api가 호출되는 경우가 브랜드&메인&서브 모두 호출된 화장품 등록 부분 밖에 없기 때문
	//나중에 필요에 의해 추후 수정하길 바람
	var query = "select * from cosmetic where id not in(select cosmetic_id from dressing_table where user_id = ?)";
	var query_params = [req.session.key];
	if(req.query.brand){
		query += " and brand = ?";
		query_params.push(req.query.brand);
	}
	if(req.query.main){
		query += " and main_category = ?";
		query_params.push(req.query.main);
	}
	if(req.query.sub){
	    if(!req.query.main){
		    res.status(message.code(6)).json(message.json(6)); return;
		}
		query += " and sub_category = ?";
		query_params.push(req.query.sub);
	}
	if(req.query.page){
		query += " limit ?,12";
		//page 시작 0 부터로 해놓았는데 오빠가 1부터가 편하다고 하시면 req.query.page-1로 변경할 것
		query_params.push((req.query.page-1)*12);
	}else{
		res.status(message.code(5)).json(message.json(5)); return;
	}
	
	connection.query(query, query_params, function (error, cursor) {
		if (error){
            res.status(message.code(11)).json(message.json(11)); return;
        }

		if (cursor.length > 0) {
			res.status(message.code(0)).json(cursor);
		} else res.status(message.code(9)).json(message.json(9));
    });
});

router.get('/get/:cosmetic_id', function(req, res, next) {
	if(req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	
	connection.query("select * from cosmetic where id = ?",[req.params.cosmetic_id], function (error, cursor) {
		if (error){
            res.status(message.code(11)).json(message.json(11)); return;
        }
        
		if (cursor.length > 0) {
			res.status(message.code(0)).json(cursor[0]);
		} else res.status(message.code(9)).json(message.json(9));
    });
});

router.get('/images/:filename', function(req, res) {
	
	req.session.destroy(function(err){ 
		if(err) res.status(message.code(14)).json(message.json(14));
	});
	
	console.log('-------------/login-------------');
	console.log('<cookies>'); 
	console.log(req.cookies);
	console.log('sessionID : '+req.sessionID);
	var filename = req.params.filename;
	var img_num = filename.replace("cosmetics_","").replace(".jpg","")*1;
	
	console.log('file  : '+'./public/images/cosmetics/' + parseInt(img_num/1000) +'/'+filename);
	try {
		var img = fs.readFileSync('./public/images/cosmetics/' + parseInt(img_num/1000) +'/'+filename);
	} catch (err) {
		if (err.code !== 'ENOENT')
			throw err;
	}
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});

router.post('/request', function(req, res, next){
	var userid =req.session.key;
	if(userid == 'undefined' || req.body.brand.length == 0 || req.body.cosmetic.length == 0){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var now = new Date();
	var query = 'insert into cosmetic_request(brand, cosmetic, user, request_date) values (?,?,?,?)';
	var query_params = [req.body.brand,req.body.cosmetic,userid,now];
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){ 
            res.status(message.code(10)).json(message.json(10));
        }else{
	        res.status(message.code(1)).json(message.json(1));
        }
	});
});

router.post('/report', function(req, res, next){
	var userid =req.session.key;
	if(userid == 'undefined' || req.body.cosmetic_id.length == 0 || req.body.problem.length == 0){
		res.status(message.code(13)).json(message.json(13)); return;
	}

	var now = new Date();
	var query = 'insert into cosmetic_report(cosmetic_id, problem, detail, user, report_date) values (?,?,?,?,?)';
	var query_params = [req.body.cosmetic_id,req.body.problem,req.body.detail,userid,now];
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){ 
            res.status(message.code(10)).json(message.json(10));
        }else{
	        res.status(message.code(1)).json(message.json(1));
        }
	});
});


router.get('/rank', function(req, res, next){
	var query = 'select * from cosmetic order by rate_num desc limit 3';
	connection.query(query, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			//console.log(info);
			res.status(message.code(1)).json(info);
		}
	});
});


router.get('/dressing_table/rank', function(req, res, next){
	var query = 'select followee_id, count(followee_id) AS count from follow group by followee_id order by count desc limit 3';
	connection.query(query, function (error, info) {
		if (error){
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			//console.log(info[0].followee_id + " " + info[1].followee_id + " " + info[2].followee_id)
			query = 'select * from user where (id = ? or id = ? or id = ?)'
			var query_params = [info[0].followee_id, info[1].followee_id, info[2].followee_id];

			connection.query(query, query_params, function (error, info) {
				if (error){
					console.log(error);
					res.status(message.code(10)).json(message.json(10));
				}else{
					//console.log(info);
					res.status(message.code(1)).json(info);
				}
			});
			//res.status(message.code(1)).json(info);
		}
	});
});


// router.get('/search/limit_3/:keyword', function(req, res, next){
// 	// var query = "select * from cosmetic where (product_name like ?);";
// 	// var query_params = ['%' + req.params.keyword + '%'];
//
// 	var query = "select * from cosmetic where product_name like ? limit 3";
// 	var query_params = ['%'+req.params.keyword+'%'];
// 	connection.query(query, query_params, function (error, info) {
// 		if (error){
// 			console.log("1");
// 			console.log(error);
// 			res.status(message.code(10)).json(message.json(10));
// 		}else{
// 			res.status(message.code(1)).json(info);
// 		}
// 	});
// });


router.get('/search/:keyword', function(req, res, next){
	// var query = "select * from cosmetic where (product_name like ?);";
	// var query_params = ['%' + req.params.keyword + '%'];

	var query = "select * from cosmetic where product_name like ?";
	var query_params = ['%'+req.params.keyword+'%'];
	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");r
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(1)).json(info);
		}
	});
});

router.get('/search/limit_3/:keyword', function(req, res, next){
	// var query = "select * from cosmetic where (product_name like ?);";
	// var query_params = ['%' + req.params.keyword + '%'];

	var query = "select * from cosmetic where product_name like ? limit 3";
	var query_params = ['%'+req.params.keyword+'%'];
	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");r
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(1)).json(info);
		}
	});
});


router.get('/search/more/quantity/:keyword', function(req, res, next){
	// var query = "select * from cosmetic where (product_name like ?);";
	// var query_params = ['%' + req.params.keyword + '%'];

	var query = "select count(*) as count from cosmetic where product_name like ?";
	var query_params = ['%'+req.params.keyword+'%'];
	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			var info_list = [];
			info_list.push(info[0].count);
			res.status(message.code(1)).json(info_list);
		}
	});
});

router.get('/search/more/:keyword/:page_num', function(req, res, next){
	var cur_page = req.params.page_num-1;
	cur_page = cur_page * 10;

	var query = "select * from cosmetic where product_name like ? limit ?, ?";
	var query_params = ['%'+req.params.keyword+'%', cur_page, cur_page+10];
	console.log(query);
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(1)).json(info);
		}
	});
});


router.get('/search/auto_complete/:keyword', function(req, res, next){
	var query = "select product_name from cosmetic where product_name like ? limit 5";
	var query_params = ['%'+req.params.keyword+'%'];

	console.log(query);
	console.log(query_params);
	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			var info_product_name = [];
			for(var i=0;i<info.length;i++){
				info_product_name.push(info[i].product_name);
			}
			console.log(info);
			res.status(message.code(1)).json(info_product_name);
		}
	});
});



router.get('/search/by_brand/quantity/:keyword', function(req, res, next){
	// var query = "select * from cosmetic where (product_name like ?);";
	// var query_params = ['%' + req.params.keyword + '%'];

	var query = "select count(*) as count from cosmetic where brand = ?";
	var query_params = [req.params.keyword];
	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			var info_list = [];
			info_list.push(info[0].count);
			res.status(message.code(1)).json(info_list);
		}
	});
});


router.get('/search/by_brand/:keyword/:page_num', function(req, res, next){
	var cur_page = req.params.page_num-1;
	cur_page = cur_page * 10;

	var query = "select * from cosmetic where brand = ? limit ?, ?";
	var query_params = [req.params.keyword, cur_page, cur_page+10];
	console.log(query);
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(1)).json(info);
		}
	});
});

//select dressing_table.*, user.name, user.profile_url, user.skin_type, user.skin_trouble_1, user.skin_trouble_2, user.skin_trouble_3 from dressing_table join user on dressing_table.user_id = user.id where cosmetic_id = "511"  limit 3;


router.get('/detail/dressing_table/review/:cosmetic_id/:page_num', function(req, res, next){
	var cur_page = req.params.page_num-1;
	cur_page = cur_page * 10;

	var query = "select dressing_table.*, user.name, user.profile_url, user.skin_type, user.skin_trouble_1, user.skin_trouble_2, user.skin_trouble_3 from dressing_table join user on dressing_table.user_id = user.id where cosmetic_id = ? limit ?, ?";
	var query_params = [req.params.cosmetic_id, cur_page, cur_page+10];
	console.log(query);
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			for(var i=0;i<info.length;i++){
				if(info[i].status=='1'){
					info[i].status = true
				}else{
					info[i].status = false
				}
			}

			res.status(message.code(1)).json(info);
		}
	});
});


router.get('/detail/dressing_table/my_review/:cosmetic_id/:user_id', function(req, res, next){
	var query = "select dressing_table.user_id, dressing_table.cosmetic_id, dressing_table.rate_num, dressing_table.review, dressing_table.status, dressing_table.expiration_date, dressing_table.purchase_date, user.name, user.profile_url, user.skin_type, user.skin_trouble_1, user.skin_trouble_2, user.skin_trouble_3 from dressing_table join user on dressing_table.user_id = user.id where (cosmetic_id = ? and user_id = ?)";
	var query_params = [req.params.cosmetic_id, req.params.user_id];
	console.log(query);
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			if(info.length != 0){
				var stat = info[0].status;
				console.log("zxc " +info[0].status);
				if(stat=='1'){
					stat = true
				}else{
					stat = false
				}
				info[0].status = stat;
			}

			console.log(info);
			res.status(message.code(1)).json(info);
		}
	});
});


router.get('/get_brand_product_quantity/:brand', function(req, res, next){
    var query = "select count(*) as cnt from cosmetic where brand = ?";
    var query_params = [req.params.brand];
    connection.query(query, query_params, function (error, info) {
        if (error){
            console.log("1");
            console.log(error);
            res.status(message.code(10)).json(message.json(10));
        }else{
        	var temp = [info[0].cnt];
            res.status(message.code(1)).json(temp);
        }
    });
});


//특정 cosmetic의 별점 갯수 5, 4, 3, 2, 1점 준 사람수 get
router.get('/get_each_rating/:cosmetic_id', function(req, res) {
	var query = "select rate_num, count(rate_num) as rate_people from dressing_table where cosmetic_id = ? and (rate_num <= '5' and rate_num >= '1') group by rate_num;";
	var query_params = [req.params.cosmetic_id];
	console.log(query);
	console.log(query_params);

	connection.query(query, query_params, function (error, info) {
		if (error){
			console.log("1");
			console.log(error);
			res.status(message.code(10)).json(message.json(10));
		}else{
			res.status(message.code(1)).json(info);
		}
	});
});

var getCosmetic = function(cosmetic_name,recommanded_cosmetic_list, callback) {
  connection.query("select * from cosmetic where product_name = ?",[cosmetic_name], function (error, cursor) {
				  console.log("mysql에서 찾자 : "+cosmetic_name);
				  
				  if(cosmetic_name == null) callback(null);
				  
					if (error){
						console.log("error : mysql server error");
			        }
			        
					if (cursor.length > 0) {
						console.log(" mysql에서 찾았다 : "+cursor[0].product_name);
						recommanded_cosmetic_list.push(cursor[0]);
						
						callback(recommanded_cosmetic_list);
				
					} else {
						console.log("error : can not find cosmetic "+cosmetic_name);
						callback(recommanded_cosmetic_list);
					}
			    });
}

//화장품 랭킹(메인)
router.get('/recommend/:user_id', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var recommanded_cosmetic_list = [];
		  
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 3, 'item_type': "cosmetic" ,'result_type' : "popluar"})
	.end(function (response) {
	
		console.log(response.body);
		if(response){
			var itemScores = response.body.itemScores;
			for(var i=0;i<=itemScores.length;i++){
				var cosmetic_name = null;
				if(i<itemScores.length) cosmetic_name = itemScores[i].item;
				
				getCosmetic(cosmetic_name,recommanded_cosmetic_list, function(result){
					if(result == null){
						console.log("끝");
						res.status(message.code(0)).json(recommanded_cosmetic_list);
					}else	recommanded_cosmetic_list = result;
				});
			}
	    }else
	        res.status(message.code(9)).json(message.json(9));
	});
});

//화장품 추천(메인)
router.get('/recommend2/:user_id', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}

	var recommanded_cosmetic_list = [];
		  
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 3, 'item_type': "cosmetic"})
	.end(function (response) {
	
		console.log(response.body);
		if(response){
			var itemScores = response.body.itemScores;
			for(var i=0;i<=itemScores.length;i++){
				var cosmetic_name = null;
				if(i<itemScores.length) cosmetic_name = itemScores[i].item;
				
				getCosmetic(cosmetic_name,recommanded_cosmetic_list, function(result){
					if(result == null){
						console.log("끝");
						res.status(message.code(0)).json(recommanded_cosmetic_list);
					}else	recommanded_cosmetic_list = result;
				});
			}
	    }else
	        res.status(message.code(9)).json(message.json(9));
	});
});

//화장품 검색(추천기반 검색결과) // 페이지 처리 아직 안되어있음.
router.get('/search2/:user_id/:query', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	
	var search_food_list = [];
	
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 3, 'item_type': "cosmetic", 'search': req.params.query })
	.end(function (response) {
	
	console.log(response.body);
		if(response){
			var itemScores = response.body.itemScores;
			for(var i=0;i<=itemScores.length;i++){
				var cosmetic_name = null;
				if(i<itemScores.length) cosmetic_name = itemScores[i].item;
				
				getCosmetic(cosmetic_name,search_food_list, function(result){
					if(result == null){
						console.log("끝");
						res.status(message.code(0)).json(search_food_list);
					}else	search_food_list = result;
				});
			}
	    }else
	        res.status(message.code(9)).json(message.json(9));
	});
});

//화장품 학습 - 상세보기
router.post('/train/view', function(req, res, next) {
	if(req.body.user_id.length == 0 || req.body.cosmetic_name.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}	

  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'event': 'view', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic_name, 'eventTime': new Date().toISOString()})
	.end(function (response) {
	  console.log(response.body);
	  if(response)
	    	return res.status(message.code(0)).json(response.body);
      else
            return res.status(message.code(9)).json(message.json(9));

	});
});
/*
//화장품 학습 - 화장품 등록 44ㅁㄹㅇㄹㅁ
router.post('/train/own', function(req, res, next) {
	if(req.body.user_id.length == 0 || req.body.cosmetic.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}	

  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'event': 'own', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic, 'eventTime': new Date().toISOString()})
	.end(function (response) {
	  console.log(response.body);
	  if(response)
	    	return res.status(message.code(0)).json(response.body);
      else
            return res.status(message.code(9)).json(message.json(9));

	});
});

//화장품 학습 - 별점 등록 ddddd
router.post('/train/rate', function(req, res, next) {
	if(req.body.user_id.length == 0 || req.body.cosmetic.length == 0 && req.body.rating.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}	

  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'event': 'rate', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'cosmetic', 'targetEntityId': req.body.cosmetic, 'properties' : { 'rating' : req.body.rating },'eventTime': new Date().toISOString()})
	.end(function (response) {
	  console.log(response.body);
	  if(response)
	    	return res.status(message.code(0)).json(response.body);
      else
            return res.status(message.code(9)).json(message.json(9));

	});
});
*/

module.exports = router;
