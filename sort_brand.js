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

connection.query('select * from brand;', function (error, cursor) {
		if (error) console.log("에러");
		
		if (cursor.length > 0) {
			console.log("성공");
			for(var i=0;i<cursor.length;i++){
				var brand = cursor[i].name;
				connection.query('select * from cosmetic where brand = ?;',brand, function (error, cursor) {
					if (error) console.log("에러");
					
					if (cursor.length > 0) {
						var size = cursor.length;
						var brand_name = cursor[0].brand;
						console.log(brand_name+" 화장품 개수 : "+size);
						connection.query("update brand set important = ? where name = ?",[size,brand_name], function (error, info) {
							if (error) console.log("에러");
							else console.log("성공");
						});
					} else console.log("선택된 값 없음");
				});
			}
		} else console.log("선택된 값 없음");
});