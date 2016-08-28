var async = require('async');
var utils = require('./utils');
var path = require('path');
var crypto = require('crypto');
var codes = require('./codes');
var uuid = require('uuid');
//{
//  "code": 400,
//   "error": "invalid_client",
//   "error_description": "Client credentials are invalid"
// }
// used for 6 digit random generator

function validateRegister(req){
    var error = new Array();
    if (!req.body.deviceUUID) error.push('No deviceUUID ID found!');
    if (!req.body.deviceTYPE) error.push('No deviceTYPE found!');
    if (!req.body.version) error.push('No version found!');
    return error.join(', ');
}

function validateLogin(req){
    var error = new Array();
    if (!req.body.email) error.push('No email found!');
    if (!req.body.password) error.push('No password found!');
    console.log(req.body);
    return error.join(', ');
}

module.exports = {
    notfound: function(req, res, next){
        var ret = {code: 404, error: 'not_found', error_description: 'Sorry, that URL is invalid'};
        res.json(ret);
        res.end();
    },
    authorise: function(req, res, next) {
        //check if user has permissions
        // utils.debug(req.oauth);
        if (req.oauth){
            // console.log(req.oauth);
            async.series([
                function(callback){
                    //ensur this is NOT a register device request
                    // console.log(req.originalUrl);
                    if (req.originalUrl.indexOf('/homebee')<=0){
                        if (req.body.deviceUUID || req.query.deviceUUID){
                            req.app.models.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID || req.query.deviceUUID})
                              .deepPopulate('user')
                              .exec(function (err, device) {
                                if (err) callback(err);
                                else {
                                  if (device){
                                    req.userdevice = device;
                                    callback();
                                  }else{
                                    utils.debug('device requesting:')
                                    utils.debug(device);
                                    callback("Sorry, device not registered with HomeBee Portal");
                                  }
                                }
                            });
                        }else{
                            callback('Sorry, you must provide deviceUUID in every request')
                        }
                    }else{
                        callback();
                    }
                }],
                function(err){
                    // console.log('done authorise');
                    if (err){
                      utils.debug(err);
                      res.json({code: 500, error: 'Error', error_description: err})
                      res.end();
                    } else {
                        next();
                    }
                }
            );
        }else{
            var error = {code: 400, error: 'unauthorised', error_description: 'Sorry request could not be authenticated'};
            utils.debug(error);
            res.json(error);
            res.end();
        }
    },
    register: function(req, res, next) {
        if (req.method=='POST'){
            var error = validateRegister(req);
            if (error.length>0){
                var ret = {code: 401, error: 'invalid_request', error_description: error};
                res.json(ret);
                res.end();
            }else{
                utils.apidebug('registering new device');
                if (req.body.deviceUUID == "NEW"){
                  //create new device
                  device = new req.app.models.HomeBeeDeviceModel({deviceUUID: uuid.v1(), deviceTYPE: req.body.deviceTYPE, version: req.body.version});
                  device.save(function(err, device) {
                    if (err){
                        utils.apidebug(err);
                        res.json({
                          "code": 600,
                          "error": "system_error",
                          "error_description": err
                        });
                        res.end();
                    }else{
                      utils.apidebug('registered new device');
                      res.status(200);
                      res.json({
                        code: 200,
                        data: device.toJSON(),
                        claimedID: "NONE"
                      });
                      res.end();
                    }
                  });
                }else{
                  req.app.models.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID})
                      .exec(function(err, device){
                          if (err) {
                              utils.apidebug(err);
                              res.status(600);
                              res.json({
                                "code": 600,
                                "error": "system_error",
                                "error_description": err
                              });
                              res.end();
                          }else if (device) {
                              device.deepPopulate('user', function(err, device){
                                  utils.apidebug("device found");
                                  utils.apidebug(device);
                                  var claimedID = "NONE";
                                  if (device.user){
                                    claimedID = device.user._id;
                                  }
                                  res.status(200);
                                  res.json({
                                    code: 200,
                                    data: device.toJSON(),
                                    claimedID: claimedID
                                  });
                                  res.end();
                              });
                          }else{
                            var ret = {code: 401, error: 'invalid_request', error_description: 'Sorry device not registered'};
                            res.status(401);
                            utils.apidebug(JSON.stringify(ret, null, 4));
                            res.json(ret);
                            res.end();
                          }
                  });
                }
            }
        }else{
            var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
            res.status(401);
            utils.apidebug(JSON.stringify(ret, null, 4));
            res.json(ret);
            res.end();
        }
    },
    login: function(req, res, next){
      var error = validateLogin(req);
      if (error.length>0){
        var ret = {code: 401, error: 'invalid_request', error_description: error};
        res.json(ret);
        res.end();
      }else{
        utils.apidebug('logging in: '+req.body.email+' / '+req.body.password);
        req.app.models.loginUser(req.body.email, req.body.password)
          .then(function(user){
            console.log(user);
            res.status(200);
            res.json({
              code: 200,
              data: user
            });
            res.end();
          })
          .catch(function(err){
            utils.apidebug(err);
            var ret = {code: 501, error: 'invalid_user', error_description: 'Email & Password do not match'};
            res.status(500);
            utils.apidebug(JSON.stringify(ret, null, 4));
            res.json(ret);
            res.end();
          });
      }
    },
    userDevices: function(req, res, next){
      console.log('returning all devices for user: '+req.body.userId);
        req.app.models.OAuthUsersModel.findOne({_id: req.body.userId}).exec()
          .then(function(user){
            console.log(user);
            req.app.models.HomeBeeDeviceModel.find({user: user}).lean().sort({deviceTYPE: 1}).exec()
              .then(function(devices){
                var d = [];
                var dType = "";
                devices.forEach(function(device){
                  if (device.deviceTYPE != dType){
                    d.push({deviceTYPE: 'divider', deviceUUID: device.deviceTYPE});
                    dType = device.deviceTYPE;
                  }
                  d.push(device);
                })
                console.log(d);
                var ret = {code: 200, devices: d};
                utils.apidebug(JSON.stringify(ret, null, 4));
                res.status(200);
                res.json(ret);
                res.end();
              })
              .catch(function(err){
                console.log(err);
                utils.apidebug(err);
                var ret = {code: 500, error: 'system_error', error_description: err};
                res.status(500);
                utils.apidebug(JSON.stringify(ret, null, 4));
                res.json(ret);
                res.end();
              })
          })
          .catch(function(err){
            console.log(err);
            utils.apidebug(err);
            var ret = {code: 500, error: 'system_error', error_description: err};
            res.status(500);
            utils.apidebug(JSON.stringify(ret, null, 4));
            res.json(ret);
            res.end();
          });
        console.log('finished');
    },
  }
