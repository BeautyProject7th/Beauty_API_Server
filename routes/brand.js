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
	connection.query('select * from brand;', function (error, cursor) {
		if (cursor.length > 0) {
			res.json(cursor);
		} else res.status(503).json(error);
    });
});

module.exports = router;
