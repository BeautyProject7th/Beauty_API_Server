const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : 'localhost'
});

router.get('/', function(req, res, next) {
	connection.query('select * from brand order by important desc;', function (error, cursor) {
		if (error) res.status(message.code(11)).json(message.json(11));
		
		if (cursor.length > 0) {
			res.status(message.code(0)).json(cursor);
		} else res.status(message.code(9)).json(message.json(9));
    });
});

router.get('/images/:filename', function(req, res) {
	
	req.session.destroy(function(err){ 
		if(err) res.status(message.code(14)).json(message.json(14));
	});
	
    var filename = req.params.filename;
    try {
        var img = fs.readFileSync('./public/images/brand/' + filename);
    } catch (err) {
        if (err.code !== 'ENOENT')
            throw err;

    }
    res.writeHead(200, {'Content-Type': 'image/gif'});
    res.end(img, 'binary');
});


router.get('/search/:keyword', function(req, res, next){
    var query = "select * from brand where name like ?";
    var query_params = ['%'+req.params.keyword+'%'];
    connection.query(query, query_params, function (error, info) {
        if (error){
            console.log(error);
            res.status(message.code(10)).json(message.json(10));
        }else{
            res.status(message.code(1)).json(info);
        }
    });
});

module.exports = router;
