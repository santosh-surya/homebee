var db = require('./dbconnection'),
  mongoose = require('mongoose'),
  async = require('async'),
  utils = require('../controllers/utils'),
  Schema = mongoose.Schema;


//
// Schemas definitions
//
var SmsSchema = new mongoose.Schema({
    mobile: String,
    message: String,
    expires: Date,
    sent: {type: Boolean, default: false}
});

var SmsModel = db.homebee.model('Sms', SmsSchema);
module.exports.SmsModel = SmsModel;
