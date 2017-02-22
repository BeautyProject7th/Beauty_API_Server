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
		if (cursor.length > 0) {
			res.json(cursor);
		} else res.status(503).json(error);
    });
});

router.post('/:user_id/cosmetics', function(req, res, next) {
	var query = 'insert into dressing_table(user_id, cosmetic_id, rate_num, review, status) values (?, ?, ?, ?, ?);';
	var query_params = [req.params.user_id, req.body.cosmetic_id, req.body.rate_num, req.body.review, req.body.status];
    connection.query(query, query_params, function (error, info) {
        if (error == null){
            res.send("success");
        } else res.status(409).json(error);
    });
});

router.get('/:user_id/cosmetics', function(req, res, next) {
	async.series([
		function(callback){
			connection.query('select * from dressing_table where user_id = ?;',[req.params.user_id], function (error, cursor) {
				if(cursor.length > 0){
					callback(null,cursor);
				}else callback(error,null);
			});
		},
		function(callback){
			var query_params = [];
            var query = 'select * from cosmetic where ';
            if(req.query.main){
                query += 'main_category = ?';
                query_params.push(req.query.main);
            }
            //sub만 들어오는 경우는 없다. 항상 main과 같이 들어온다.
            if(req.query.sub){
                query += ' and sub_category = ?';
                query_params.push(req.query.sub);     
            }
            connection.query(query,query_params, function (error, cosmetics) {
                if(cosmetics.length>0){
                    callback(null,cosmetics);
            	}else callback(error,null);
        	});
		}
	],function(err,results){
		if(err) res.status(503).json(error);
		
		//교집합 구함
		var cosmetic_id_list = results[0].map(function(item){ 
			return item.cosmetic_id; 
		});
		var cosmetics = results[1].filter(function(item){ 
			if(cosmetic_id_list.indexOf(item.id) !== -1) return item;
		});
		console.log(cosmetics);
		
		//화장품id기준으로 각각 정렬
		var dressing_tables = results[0].sort(function (a, b) {
			return a.cosmetic_id - b.cosmetic_id;
		});
		cosmetics.sort(function (a, b) {
			return a.id - b.id;
		});
		
		//결과값 출력
		var rate_num_list = dressing_tables.map(function(item){
			return item.rate_num;
		});
		for(var i=0;i<cosmetics.length;i++){
			cosmetics[i].rate_num = rate_num_list[i];
		}
		res.json(cosmetics);
	});
});

router.get('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	async.waterfall([
	    function (callback) {
	        connection.query('select * from dressing_table where user_id = ? and cosmetic_id = ?;',[req.params.user_id, req.params.cosmetic_id], function (error, cursor) {
				if(cursor.length > 0){
					callback(null,cursor[0].rate_num);
				}else callback(error,null);
			});
	    },
	    function (rate_num, callback) {
		    connection.query('select * from cosmetic where id = ?;',[req.params.cosmetic_id], function (error, cursor) {
				if(cursor.length > 0){
					cursor[0].rate_num = rate_num;
					callback(null,cursor[0]);
				}else callback(error,null);
			});
		}
	],
	function (err, result) {
	    if(err) res.status(503).json(error);
	    res.json(result);
	});
});

router.put('/:user_id/cosmetics/:cosmetic_id', function(req, res, next) {
	var query = 'update dressing_table set rate_num=?, review=?, status=? where user_id = ? and cosmetic_id = ?;';
	var query_params = [ req.body.rate_num, req.body.review, req.body.status, req.params.user_id, req.params.cosmetic_id ];
    connection.query(query, query_params, function (error, info) {
        if (error == null){
            res.send("success");
        } else res.status(503).json(error);
    });
});


module.exports = router;

