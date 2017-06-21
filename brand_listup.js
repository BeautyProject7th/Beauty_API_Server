var mysql = require('mysql');
var express = require('express');
var unirest = require('unirest');

var accessKey = "f_PRhA427occkummIefOwe7JuZifKS2AM-VuLBRA4B9-ry8b_Ce8kPF_agGsCBBi";

var connection = mysql.createConnection({
    user : 'root',
    password : '159753', 
    database : 'BeautyProject', 
    host : 'localhost'
});

//화장품 set하기

connection.query('select * from cosmetic;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var cosmetic = cursor[i];
				console.log("화장품 명 : "+cosmetic.product_name);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': '$set', 
					'entityType': 'cosmetic', 
					'entityId': cosmetic.product_name, 
					'properties' : {
				        'brand' : cosmetic.brand,
				        'categories' : [cosmetic.main_category, cosmetic.sub_category]
				        },
					'eventTime': new Date().toISOString()})
				.end(function (response) {
				  if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
				});
			}
		} else console.log("선택된 값 없음");
});

//기존 회원 set하기
connection.query('select * from user;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var user = cursor[i];
				console.log("사람이름 : "+user.name);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': '$set', 
					'entityType': 'user', 
					'entityId': user.id.toString(), 
					'eventTime': new Date().toISOString()})
				.end(function (response) {
				  if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
				});
			}
		} else console.log("선택된 값 없음");
});

//컨텐츠 set하기
connection.query('select * from video;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var content = cursor[i];
				console.log("content 명 : "+content.title);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': '$set', 
					'entityType': 'content', 
					'entityId': content.title, 
					'properties' : {
				        'upload_date' : content.upload_date,
				        'cosmetics' : ["에뛰드하우스 순정 약산성 5.5 진정 토너 180ml","산수시 젠틀 토너 200ml"]
				        },
					'eventTime': new Date().toISOString()})
				.end(function (response) {
				  if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
				});
			}
		} else console.log("선택된 값 없음");
});

// 화장품 있는 아이템 넣기
var cos_list = ["에뛰드하우스 순정 약산성 5.5 진정 토너 180ml","산수시 젠틀 토너 200ml","바이빠세 로즈 워터 무알콜 토너 500ml","파머메이커 가지페어 스피드 에그플란트 토너 120ml","아이소이 내 피부 속에 마르지 않는 옹달샘 촉촉 스킨 130ml","이니스프리 비자 안티 트러블 로션 100ml"];
var index = 0;

connection.query('select * from video;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<6;i++){
				var content = cursor[i];
				console.log("content 명 : "+content.title);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': '$set', 
					'entityType': 'content', 
					'entityId': content.title, 
					'properties' : {
				        'upload_date' : content.upload_date,
				        'cosmetics' : [cos_list[index++],cos_list[index++]]
				        },
					'eventTime': new Date().toISOString()})
				.end(function (response) {
				  if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
				});
			}
		} else console.log("선택된 값 없음");
});

//모든 cosmetic event 한번씩(유저 이인환)
connection.query('select * from cosmetic;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var cosmetic = cursor[i];
				console.log("화장품 명 : "+cosmetic.product_name);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': 'view', 'entityType': 'user', 'entityId': '1883054368607681', 'targetEntityType': 'cosmetic', 'targetEntityId': cosmetic.product_name, 'eventTime': new Date().toISOString()})
				.end(function (response) {
				  console.log(response.body);
				   if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
			
				});
			}
		} else console.log("선택된 값 없음");
});
//모든 content event 한번씩(유저 이인환)
connection.query('select * from video;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var content = cursor[i];
				console.log("content 명 : "+content.title);
				unirest.post('http://localhost:7070/events.json?accessKey='+accessKey)
				.headers({'Accept': 'application/json', 'Content-Type': 'application/json;charset=UTF-8'})
				.send({'event': 'view', 'entityType': 'user', 'entityId': '1883054368607681', 'targetEntityType': 'content', 'targetEntityId': content.title, 'eventTime': new Date().toISOString()})
				.end(function (response) {
				  console.log(response.body);
				   if(response)
				    	console.log(response.body);
			      else
			            console.log("pio 생성 실패");
			
			
				});
			}
		} else console.log("선택된 값 없음");
});
