const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
require('date-utils');

fs = require('fs');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : '13.112.190.217'
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

router.get('/:cosmetic_id', function(req, res, next) {
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
	var img = fs.readFileSync('./public/images/cosmetics/' + parseInt(img_num/1000) +'/'+filename);
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

module.exports = router;
