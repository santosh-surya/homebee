var db = require('./dbconnection'),
  mongoose = require('mongoose'),
  async = require('async'),
  utils = require('../controllers/utils'),
  Schema = mongoose.Schema;
   
  
//
// Schemas definitions
//
var UserSchema = new mongoose.Schema({
    name: String,
    mobile: String,
    email: String,
});

var UserModel = db.junglebee.model('User', UserSchema);
module.exports.UserModel = UserModel;

