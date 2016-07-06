var mongoose = require('mongoose');
var utils = require('../controllers/utils');
var urioauth2 = 'mongodb://localhost/homebee_oauth2';
var urihomebee = 'mongodb://localhost/homebee';
if (utils.args.dbdebug)
    mongoose.set('debug', true);

// Makes connection asynchronously. Mongoose will queue up database
// operations and release them when the connection is complete.
exports.oauth2 = mongoose.createConnection(urioauth2);
exports.junglebee = mongoose.createConnection(urihomebee);

// CONNECTION EVENTS
// When successfully connected
exports.oauth2.on('connected', function () {
  utils.debug('Mongoose oauth2 connection open to ' + urioauth2);
});

// If the connection throws an error
exports.oauth2.on('error',function (err) {
  utils.debug('Mongoose oauth2 connection error: ' + err);
});

// When the connection is disconnected
exports.oauth2.on('disconnected', function () {
  utils.debug('Mongoose oauth2 connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  exports.oauth2.close(function () {
    utils.debug('Mongoose oauth2 connection disconnected through app termination');
    process.exit(0);
  });
});

// CONNECTION EVENTS
// When successfully connected
exports.junglebee.on('connected', function () {
  utils.debug('Mongoose junglebee connection open to ' + urihomebee);
});

// If the connection throws an error
exports.junglebee.on('error',function (err) {
  utils.debug('Mongoose junglebee connection error: ' + err);
});

// When the connection is disconnected
exports.junglebee.on('disconnected', function () {
  utils.debug('Mongoose junglebee connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  exports.junglebee.close(function () {
    utils.debug('Mongoose junglebee connection disconnected through app termination');
    process.exit(0);
  });
});
