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
	connection.query('select * from category;', function (error, cursor) {
		if (cursor.length > 0) {
			var results = [];
			var before_main = null;
			var object;
			cursor.forEach(function (item){
				if(before_main != item.main_category){
					if(before_main != null) results.push(object);
					object = {
						'main_category': item.main_category,
						'sub_category': []
					};
				}
				object.sub_category.push(item.sub_category);
				before_main = item.main_category;
			});
			results.push(object);
			res.json(results);
		} else res.status(503).json(error);
    });
});

module.exports = router;
