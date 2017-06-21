const message = require('../message');
var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var async = require("async");
require('date-utils');

fs = require('fs');

var connection = mysql.createConnection({
    user : 'root',
    password : '159753',
    database : 'BeautyProject',
    host : '13.124.137.105'
});


router.get('/:name', function(req, res, next) {
    connection.query('select * from youtuber where name = ?;',[req.params.name], function (error, cursor) {
        if (error) res.status(message.code(11)).json(message.json(11));

        if (cursor.length > 0) {
            res.status(message.code(0)).json(cursor[0]);
        }else res.status(message.code(9)).json(message.json(9));
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
    var img_num = filename.replace("youtuber_","").replace(".jpg","")*1;

    console.log('file  : '+'./public/images/youtuber/' + parseInt(img_num/1000) +'/'+filename);
    try {
        var img = fs.readFileSync('./public/images/youtuber/' + parseInt(img_num/1000) +'/'+filename);
    } catch (err) {
        if (err.code !== 'ENOENT')
            throw err;

    }

    res.writeHead(200, {'Content-Type': 'image/gif'});
    res.end(img, 'binary');
});


module.exports = router;

