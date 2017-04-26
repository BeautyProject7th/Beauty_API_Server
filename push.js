var FCM = require('fcm-push'); 
var mysql = require('mysql');

var serverKey = 'AAAAiF04B24:APA91bHVabupccjcuHjmah4iaOwY2TfBdk10LbgdRQT9WEkEAyIY60FZUWIMQ4X6TKguvP3YsWI3aGJMhgGuPGtmd1HMZJxhAeO3ui0GWEFkpUP-f8-uYMu7E0lVqNlBssKbnU9YHvQK '; 
var fcm = new FCM(serverKey); 


var message = { 
	to: 'cPDxl2fyngk:APA91bG0P4FSrowWA4x1XHAzs55OqJhK6ib84jJA9tJpCON7_b6HQYQ3z-OaPk3_nO2mlwnRVFCxcwKtW06fWqfV5Vk7mOMHAARNpzoBY9CUJm7Eq94XVk4f5HZU8VTnJnNbX4RpO6xj', // required fill with device token or topics 
	//collapse_key: 'your_collapse_key', 
	//data: { your_custom_data_key: 'your_custom_data_value' }, 
	notification: { 
		title: 'Title of your push notification', 
		body: 'Body of your push notification' 
	} 
};

fcm.send(message, function(err, response){ 
	if (err) { 
		console.log("Something has gone wrong!"); 
		console.log(err);
	} else { 
		console.log("Successfully sent with response: ", response); 
	} 
});

