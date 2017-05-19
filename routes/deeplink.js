var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    console.log("deeplink");

    //var output = "<a id='deeplink' href='callmyapp://video'>deeplink</a>"
    var output = "<a id='deeplink' href='intent://video#Intent;scheme=callmyapp;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.makejin.beautyproject_android;end'>deeplink</a>"
    res.send(output);

});

module.exports = router;
