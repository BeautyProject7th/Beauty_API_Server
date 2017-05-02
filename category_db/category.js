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

connection.connect();

/*
//[화장 소품 - 브러쉬] 찾기 : (네이버) sub_category = 메이크업 브러시
connection.query("select * from cosmetic where sub_category = ?",'메이크업브러시', function (error, cursor) {
		if (error){
            console.log("에러");
        }
        
		if (cursor.length > 0) {
			console.log("길이 : "+cursor.length);
			for(var i=0; i<cursor.length; i++){
				console.log('id : '+cursor[i].id);
				var query = 'update cosmetic SET sub_category = ?, main_category = ? WHERE sub_category = ?';
				var query_params = ['브러쉬','화장 소품','메이크업브러시'];
				connection.query(query, query_params, function (error, info) {
					if(error){
						console.log(error);
					}
					else{
						console.log("메이크업브러시 카테고리 변경 완료");
					}
				});
			}
		} else console.log("값 없음");
    });
*/

connection.query("select * from cosmetic where product_name LIKE ?",'%남성%', function (error, cursor) {
		if (error){
            console.log("에러");
        }
        
		if (cursor.length > 0) {
			console.log("길이 : "+cursor.length);
			for(var i=0; i<cursor.length; i++){
				//console.log('id : '+cursor[i].id);
				console.log('name : '+cursor[i].product_name);
				/*
				var query = 'update cosmetic SET sub_category = ?, main_category = ? WHERE sub_category = ?';
				var query_params = ['브러쉬','화장 소품','메이크업브러시'];
				connection.query(query, query_params, function (error, info) {
					if(error){
						console.log(error);
					}
					else{
						console.log("메이크업브러시 카테고리 변경 완료");
					}
				});
				*/
			}
		} else console.log("값 없음");
    });
    
    connection.query("select * from cosmetic where main_category = ?",'베이스메이크업', function (error, cursor) {
		if (error){
            console.log("에러");
        }
        
		if (cursor.length > 0) {
			console.log("길이 : "+cursor.length);
			for(var i=0; i<cursor.length; i++){
				//console.log('id : '+cursor[i].id);
				console.log('name : '+cursor[i].product_name);
			
				var query = 'update cosmetic SET main_category = ? WHERE main_category = ?';
				var query_params = ['베이스 메이크업','베이스메이크업'];
				connection.query(query, query_params, function (error, info) {
					if(error){
						console.log(error);
					}
					else{
						console.log("베이스메이크업 카테고리 변경 완료");
					}
				});
				
			}
		} else console.log("값 없음");
    });


//connection.end();