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

router.get('/:id', function(req, res, next) {
	connection.query('select * from user where id = ?;',[req.params.id], function (error, cursor) {
		if (error) res.status(message.code(11)).json(message.json(11));
		
		if (cursor.length > 0) {
			res.status(message.code(0)).json(cursor[0]);
		}else res.status(message.code(2)).json(message.json(2));
    });
});

router.post('/:user_id/cosmetics', function(req, res, next) {
	//status는 프로토타입 기능에 있지 않다.
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	if(req.body.id.length == 0){
		res.status(message.code(13)).json(message.json(13)); return;
	}	
	var query = 'insert into dressing_table(user_id, cosmetic_id, rate_num, review, status) values (?, ?, ?, ?, ?);';
	var query_params = [req.params.user_id, req.body.id, req.body.rate_num, req.body.review, req.body.status];
    connection.query(query, query_params, function (error, info) {
        if (error == null){
            res.status(message.code(2)).json(message.json(2));
        } else {
            res.status(message.code(10)).json(message.json(10));		}
    });
});

router.get('/:user_id/cosmetics',function(req, res, next){
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
	        query_params.push(req.query.page*20);
        }
		
		connection.query(query, query_params, function (error, cursor) {
	        if (error == null){
	            if (cursor.length > 0) {
					callback(null, queryflag, cursor);
				} else callback(2,null);
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

router.get('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	if(req.params.user_id.length == 0 || req.params.cosmetic_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}
		
	async.waterfall([
	    function (callback) {
	        connection.query('select * from dressing_table where user_id = ? and cosmetic_id = ?;',[req.params.user_id, req.params.cosmetic_id], function (error, cursor) {
		        if (error) callback(11, results);
		        
				if(cursor.length > 0){
					callback(null,cursor[0].rate_num);
				}else callback(2,null);
			});
	    },
	    function (rate_num, callback) {
		    connection.query('select * from cosmetic where id = ?;',[req.params.cosmetic_id], function (error, cursor) {
			    if (error) callback(11, results);
			    
				if(cursor.length > 0){
					cursor[0].rate_num = rate_num;
					callback(null,cursor[0]);
				}else callback(2,null);
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
		if(query_params.length > 0) query += ' ,';
		query += ' review = ?';
	}
	if(req.body.status){
		flag = true;
		query_params.push(req.body.status);
		if(query_params.length > 0) query += ' ,';
		query += ' status = ?';
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
            res.status(message.code(2)).json(message.json(2));
        } else {
            res.status(message.code(11)).json(message.json(11));
 		}
    });
});

router.get('/images/:filename', function(req, res) {
	var filename = req.params.filename;
	var img = fs.readFileSync('./public/images/users/' + filename);
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});

module.exports = router;

