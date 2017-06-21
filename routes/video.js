const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var unirest = require('unirest');
var router = express.Router();
require('date-utils');

fs = require('fs');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753',
    database : 'BeautyProject',
    host : '13.124.137.105'
});

var accessKey = "f_PRhA427occkummIefOwe7JuZifKS2AM-VuLBRA4B9-ry8b_Ce8kPF_agGsCBBi";

router.get('/search/:keyword', function(req, res, next){
    //var query = "SELECT * FROM video where description like ? limit 3;";
    //select * from youtuber where name COLLATE utf8_unicode_ci in (select youtuber_name from video where description like "%c%" );
    var query = "select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where description like ? LIMIT 1";
    var query_params = ['%'+req.params.keyword+'%'];
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

router.get('/search/:keyword/:page_num', function(req, res, next){
    var cur_page = req.params.page_num-1;
    cur_page = cur_page * 10;

    var query = "select video.*, youtuber.profile_url, youtuber.skin_type, youtuber.skin_trouble_1, youtuber.skin_trouble_2, youtuber.skin_trouble_3 from video join youtuber on video.youtuber_name = youtuber.name COLLATE utf8_unicode_ci where description like ? LIMIT ?, ?";
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


router.get('/search/more/quantity/:keyword', function(req, res, next){
    // var query = "select * from cosmetic where (product_name like ?);";
    // var query_params = ['%' + req.params.keyword + '%'];

    var query = "select count(*) as count from video where description like ?";
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

router.get('/cosmetics/:video_id', function(req, res, next){
    //var query = "SELECT * FROM video where description like ? limit 3;";
    //select * from BeautyProject.cosmetic where id in (select cosmetic_id from BeautyProject.video_cosmetic where video_id = '11' )
    //select * from youtuber where name COLLATE utf8_unicode_ci in (select youtuber_name from video where description like "%c%" );
    var query = "select * from cosmetic where id in (select cosmetic_id from video_cosmetic where video_id = ? )";
    var query_params = [req.params.video_id];
    console.log(query);
    console.log(query_params);

    connection.query(query, query_params,  function (error, cursor) {
        if (error){
            res.status(message.code(11)).json(message.json(11));
        }else{
            if(cursor.length>0){
	            console.log(cursor[0].product_name);
	            res.status(message.code(0)).json(cursor);
            }else{
	            res.status(message.code(11)).json(message.json(11));
            }
        }
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
    var img_num = filename.replace("video_","").replace(".jpg","")*1;

    console.log('file  : '+'./public/images/video/' + parseInt(img_num/1000) +'/'+filename);

    console.log("img1 : ");
    try {
        var img = fs.readFileSync('./public/images/video/' + parseInt(img_num/1000) +'/'+filename);
    } catch (err) {
        if (err.code !== 'ENOENT')
            throw err;

    }

    res.writeHead(200, {'Content-Type': 'image/gif'});
    res.end(img, 'binary');
});


var getVideo = function(video_title,recommanded_video_list, callback) {
  connection.query("select * from video where title = ?",[video_title], function (error, cursor) {
				  console.log("mysql에서 찾자 : "+video_title);
				  
				  if(video_title == null) callback(null);
				  
					if (error){
						console.log("error : mysql server error");
			        }
			        
					if (cursor.length > 0) {
						console.log(" mysql에서 찾았다 : "+cursor[0].title);
						recommanded_video_list.push(cursor[0]);
						
						callback(recommanded_video_list);
				
					} else {
						console.log("error : can not find video "+video_title);
						callback(recommanded_video_list);
					}
			    });
}

//컨텐츠 추천(메인)
router.get('/recommend/:user_id', function(req, res, next) {
	if(req.params.user_id.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	var recommanded_video_list = [];
	
	//TODO : 지금은 랭킹이 아니라 추천임! (랭킹으로 바꿀 것)
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 2, 'item_type': 'content'})
	.end(function (response) {
	  console.log(response.body);
		if(response){
			var itemScores = response.body.itemScores;
			for(var i=0;i<=itemScores.length;i++){
				var video_title = null;
				if(i<itemScores.length) video_title = itemScores[i].item;
				
				getVideo(video_title,recommanded_video_list, function(result){
					if(result == null){
						console.log("끝");
						res.status(message.code(0)).json(recommanded_video_list);
					}else	recommanded_video_list = result;
				});
			}
	    }else
	        res.status(message.code(9)).json(message.json(9));
	});
});

//관련 컨텐츠(화장품 상세페이지)
router.get('/recommend/cosmetic/:cosmetic/:user_id', function(req, res, next) {
	if(req.params.cosmetic.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	
	var recommanded_video_list = [];
	
	//TODO : 지금은 랭킹이 아니라 추천임! (랭킹으로 바꿀 것)
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 10, 'item_type': "content", 'cosmetic': req.params.cosmetic })
	.end(function (response) {
		
		console.log(response.body);
		if(response){
			if(response.body.itemScores.length>0){
				console.log("값이 있다.")
				var itemScores = response.body.itemScores;
				for(var i=0;i<=itemScores.length;i++){
					var video_title = null;
					if(i<itemScores.length) video_title = itemScores[i].item;
					
					getVideo(video_title,recommanded_video_list, function(result){
						if(result == null){
							console.log("끝");
							res.status(message.code(0)).json(recommanded_video_list);
						}else	recommanded_video_list = result;
					});
				}
		    }else{
				unirest.post('http://13.124.137.105:8000/queries.json')
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'user': req.params.user_id, 'num': 10, 'item_type': 'content' ,'result_type' : 'popluar'})
				.end(function (response) {
				console.log("대중적인거 찾자")
					console.log(response.body);
					if(response){
						var itemScores = response.body.itemScores;
						for(var i=0;i<=itemScores.length;i++){
							var video_title = null;
							if(i<itemScores.length) video_title = itemScores[i].item;
							
							getVideo(video_title,recommanded_video_list, function(result){
								if(result == null){
									console.log("끝");
									res.status(message.code(0)).json(recommanded_video_list);
								}else	recommanded_video_list = result;
							});
						}
				    }else
				        res.status(message.code(9)).json(message.json(9));
				});
			}
		}else{
			res.status(message.code(9)).json(message.json(9));
		}
	});
});

//컨텐츠 검색(추천기반 검색결과) // 페이지 처리 아직 안되어있음.
router.get('/search2/:user_id/:query', function(req, res, next) {
	if(req.params.user_id.length == 0||req.params.query.length == 0){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	
	var recommanded_video_list = [];
	
  	unirest.post('http://13.124.137.105:8000/queries.json')
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'user': req.params.user_id, 'num': 10, 'item_type': 'content', 'search': req.params.query })
	.end(function (response) {
	  console.log(response.body);
		if(response){
			var itemScores = response.body.itemScores;
			for(var i=0;i<=itemScores.length;i++){
				var video_title = null;
				if(i<itemScores.length) video_title = itemScores[i].item;
				
				getVideo(video_title,recommanded_video_list, function(result){
					if(result == null){
						console.log("끝");
						res.status(message.code(0)).json(recommanded_video_list);
					}else	recommanded_video_list = result;
				});
			}
	    }else
	        res.status(message.code(9)).json(message.json(9));
	});
});

//컨텐츠 학습 - 상세보기
router.post('/train/view', function(req, res, next) {
	if(req.body.user_id.length == 0 || req.body.content.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}	

  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'event': 'view', 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'content', 'targetEntityId': req.body.content, 'eventTime': new Date().toISOString()})
	.end(function (response) {
	  console.log(response.body);
	  if(response)
	    	return res.status(message.code(0)).json(message.code(0));
      else
            return res.status(message.code(9)).json(message.json(9));

	});
});

//컨텐츠 학습 - 찜 등록
router.post('/train/scrap', function(req, res, next) {
	if(req.body.scrap_bool == null || req.body.user_id.length == 0 || req.body.content.length == 0 ){
		res.status(message.code(4)).json(message.json(4)); return;
	}	
	
	var scrap_str = 'scrap';
	if(req.body.scrap_bool==false) scrap_str = 'cancle_scrap';

  	unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
	.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
	.send({'event': scrap_str, 'entityType': 'user', 'entityId': req.body.user_id, 'targetEntityType': 'content', 'targetEntityId': req.body.content, 'eventTime': new Date().toISOString()})
	.end(function (response) {
	  console.log(response.body);
	  if(response)
	    	return res.status(message.code(0)).json(message.code(0));
      else
            return res.status(message.code(9)).json(message.json(9));

	});
});


module.exports = router;
