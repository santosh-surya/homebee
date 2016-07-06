var async = require('async');
var utils = require('./utils');
var path = require('path');
var crypto = require('crypto');
var codes = require('./codes');
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
                    //get roles for the user
                    // utils.debug('getting roles for '+ req.oauth.bearerToken.userId + ' '+ req.oauth.bearerToken.clientId);
                    req.app.oauthModel.findUserRoles({userId: req.oauth.bearerToken.userId, clientId: req.oauth.bearerToken.clientId}, function(err, userroles){
                        if (err) callback(err);
                        else {
                            // console.log('get roles for the user');
                            req.userRoles = userroles;
                            callback();
                        }
                    });
                },
                function(callback){
                    //ensur this is NOT a register device request
                    // console.log(req.originalUrl);
                    if (req.originalUrl.indexOf('/homebee/register')<=0 && req.originalUrl.indexOf('/homebee/sms')<=0){
                        if (req.body.deviceUUID || req.query.deviceUUID){
                            req.app.homebeedevices.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID || req.query.deviceUUID}).populate('user').exec(function (err, device) {
                                if (err) callback(err);
                                else{
                                    utils.debug('device requesting:')
                                    utils.debug(device);
                                    if (!device) callback("Sorry, device not registered with HomeBee Portal");
                                    else{
                                        req.userdevice = device;
                                        callback();
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
                    var error = {code: 400, error: 'unauthorised', error_description: err};
                    if (err){
                        // console.log('calling next');
                        next(error);
                    } else {
                        // console.log('calling next');
                        next();
                    }
                }
            );
        }else{
            var error = {code: 400, error: 'unauthorised', error_description: 'Sorry request could not be authenticated'};
            // console.log('calling next');
            next(error);
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
                  device = new req.app.homebeedevices.HomeBeeDeviceModel({deviceUUID: req.body.deviceUUID, deviceTYPE: req.body.deviceTYPE, version: req.body.version});
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
                      res.json({
                        code: 200,
                        data: device.toJSON(),
                        claimedID: "NONE"
                      });
                      res.end();
                    }
                  });
                }else{
                  req.app.homebeedevices.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID})
                      .exec(function(err, device){
                          if (err) {
                              utils.apidebug(err);
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
                                  res.json({
                                    code: 200,
                                    data: device.toJSON()
                                  });
                                  res.end();
                              });
                          }else{
                            var error = {code: 401, error: 'invalid_request', error_description: 'Sorry device not registered'};
                          }
                  });
                }
            }
        }else{
            var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
            utils.apidebug(JSON.stringify(ret, null, 4));
            res.json(ret);
            res.end();
        }
    },
    update: function(req, res, next){
        var ret = {code: 200, data: 'All good'};
        utils.apidebug(JSON.stringify(ret, null, 4));
        res.json(ret);
        res.end();
    },
  }
