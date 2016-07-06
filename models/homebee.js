var db = require('./dbconnection'),
  mongoose = require('mongoose'),
  async = require('async'),
  deepPopulate = require('mongoose-deep-populate')(mongoose);

//
// Schemas definitions
//
var HomeBeeDeviceSchema = new mongoose.Schema({
    deviceUUID: String,
    deviceTYPE: String,
    version: String,
    status: String,
    command: String,
    lastUpdate: Date,
    user:{ type:mongoose.Schema.ObjectId, ref:"User" }
});
HomeBeeDeviceSchema.plugin(deepPopulate, {});

var HomeBeeDeviceModel = db.junglebee.model('HomeBeeDevice', HomeBeeDeviceSchema);
module.exports.HomeBeeDeviceModel = HomeBeeDeviceModel;
