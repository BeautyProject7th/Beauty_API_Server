const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var router = express.Router();

fs = require('fs');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.112.190.217'
});

router.get('/', function(req, res, next) {
	//*예외처리 : req.query.page없을 경우!
	
	//일단 어떤 경우든 12개씩 리턴되게 만들어 놓았음
	//프로토타입에서는 이 api가 호출되는 경우가 브랜드&메인&서브 모두 호출된 화장품 등록 부분 밖에 없기 때문
	//나중에 필요에 의해 추후 수정하길 바람
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
		query += " limit ?,12";
		//page 시작 0 부터로 해놓았는데 오빠가 1부터가 편하다고 하시면 req.query.page-1로 변경할 것
		query_params.push(req.query.page*12);
	}
	console.log(query);
	connection.query(query,query_params, function (error, cursor) {
		if(cursor == null){
			return res.json([]);
		}

		if (cursor.length > 0) {
			res.json(cursor);
		} else res.json([]);//res.status(503).json(error);
    });
});

router.get('/:cosmetic_id', function(req, res, next) {
	connection.query("select * from cosmetic where id = ?",[req.params.cosmetic_id], function (error, cursor) {
		if (cursor.length > 0) {
			res.json(cursor[0]);
		} else res.status(message.code(2)).json(message.json(2));
    });
});

router.get('/images/:filename', function(req, res) {
	var filename = req.params.filename;
	var img_num = filename.replace("cosmetics_","").replace(".jpg","")*1;

	var img = fs.readFileSync('./public/images/cosmetics/' + parseInt(img_num/10000) +'/'+filename);
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.end(img, 'binary');
});

module.exports = router;
