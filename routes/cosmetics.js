var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.112.190.217'
});

router.get('/', function(req, res, next) {
	var query = "select * from cosmetic";
	var query_params = [];
	if(req.query.brand){
		query += " where brand = ?";
		query_params.push(req.query.brand);
	}
	if(req.query.main){
		if(query_params.length > 0) query += " and";
		else query += " where"
		query += " main_category = ?";
		query_params.push(req.query.main);
		if(req.query.sub){
			query += " and sub_category = ?";
			query_params.push(req.query.sub);
		} 
	}
	console.log(query);
	connection.query(query,query_params, function (error, cursor) {
		if (cursor.length > 0) {
			res.json(cursor);
		} else res.status(503).json(error);
    });
});

router.get('/:cosmetic_id', function(req, res, next) {
	connection.query("select * from cosmetic where id = ?",[req.params.cosmetic_id], function (error, cursor) {
		if (cursor.length > 0) {
			res.json(cursor[0]);
		} else res.status(503).json(error);
    });
});

module.exports = router;
