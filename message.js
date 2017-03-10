const message = [
  'Success',  // 0 - 200
  'Created', // 1 - 201
  'No content', // 2 - 204
  'Deleted', // 3 - 204
  'Bad request. invalid parameter', // 4 - 400
  'Bad request. please check \'page\' query', // 5 - 400
  'Bad request. \'sub\' must write \'main\' together', // 6 - 400
  'Unauthorized. Please login', // 7 - 401
  'No user. Please check your account.',  // 8 - 403
  'not found', // 9 - 404
  'Conflict. Already exists', // 10 - 409
  'Internal server error',  // 11 - 500
  'Service unavailable'  // 12 - 503
 ];

const code = [
  200, // 0
  201, // 1
  204, // 2
  204, // 3
  400, // 4
  400, // 5
  400, // 6
  401, // 7
  403, // 8
  404, // 9
  409, // 10
  500, // 11
  503 // 12
];

exports.code = function (num) {
  return code[num];
};

exports.json = function (num, err) {
  const json = { code: num, message: message[num] };
  if (num == 1)
    json.err = err;
  return json;
};