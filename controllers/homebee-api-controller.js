var async = require('async');
var utils = require('./utils');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var codes = require('./codes');
var uuid = require('uuid');
const md5File = require('md5-file');

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
    if (!req.body.chipId) error.push('No chipId found!');
    return error.join(', ');
}
function validateAddFirmware(req){
    var error = new Array();
    if (!req.body.deviceTYPE){
      error.push('No deviceTYPE found!');
    }
    if (!req.body.version){
      error.push('No version found!');
    }
    if (!req.file){
      error.push('no file received');
    }
    return error.join(', ');
}
function validateAddCommand(req){
    var error = new Array();
    if (!req.body.deviceUUID){
      error.push('No deviceUUID ID found!');
    }
    if (!req.body.command){
      error.push('no command received');
    }
    return error.join(', ');
}
function validateDeviceCommandUpdate(req){
    var error = new Array();
    if (!req.userdevice){
      error.push('No deviceUUID ID found!');
    }
    if (!req.body.commandId){
      error.push('no commandId received');
    }
    return error.join(', ');
}
function validatePing(req){
    var error = new Array();
    if (!req.userdevice){
      error.push('No deviceUUID ID found!');
    }
    // if (!req.body.message){
    //   error.push('no ping message received');
    // }
    return error.join(', ');
}
function validateUpdate(req){
  // "user-agent": "ESP8266-http-Update",
  //   "connection": "close",
  //   "x-esp8266-sta-mac": "5C:CF:7F:13:97:B0",
  //   "x-esp8266-ap-mac": "5E:CF:7F:13:97:B0",
  //   "x-esp8266-free-space": "2723840",
  //   "x-esp8266-sketch-size": "420096",
  //   "x-esp8266-chip-size": "4194304",
  //   "x-esp8266-sdk-version": "1.5.3(aec24ac9)",
  //   "authorization": "Bearer 55a83248a84f054ecdb82b8dafd6b7fc61aa8078",
  //   "deviceuuid": "ad4fd980-7500-11e6-9b71-031a31a68c63",
  //   "x-esp8266-mode": "sketch",
  //   "x-esp8266-version": "1.0"
  var error = new Array();
  if(req.headers["user-agent"] != 'ESP8266-http-Update') {
      error.push('only for ESP8266 updater!');
  }else if(
      !req.headers['x-esp8266-sta-mac'] ||
      !req.headers['x-esp8266-ap-mac'] ||
      !req.headers['x-esp8266-free-space'] ||
      !req.headers['x-esp8266-sketch-size'] ||
      !req.headers['x-esp8266-chip-size'] ||
      !req.headers['x-esp8266-sdk-version'] //||
      //!req.headers['x-esp8266-version']
  ) {
    error.push('only for ESP8266 updater! (header)!');
  }
  if (!req.userdevice){
    error.push('No deviceUUID ID found!');
  }
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
                    if (req.originalUrl.indexOf('/homebee/device')>=0 && req.originalUrl.indexOf('/homebee/device/register')<0){
                        // utils.apidebug(req.headers);
                        if (req.body.deviceUUID || req.query.deviceUUID|| req.headers.deviceuuid){
                            req.app.models.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID || req.query.deviceUUID || req.headers.deviceuuid})
                              .deepPopulate('user')
                              .exec(function (err, device) {
                                if (err) callback(err);
                                else {
                                  if (device){
                                    req.userdevice = device;
                                    callback();
                                  }else{
                                    utils.debug('device requesting:')
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
                      res.status(500);
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
      utils.apidebug(req.body);
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
                  device = new req.app.models.HomeBeeDeviceModel({deviceUUID: uuid.v1(), deviceTYPE: req.body.deviceTYPE, version: req.body.version, chipId: req.body.chipId, command: "NONE"});
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
                            //let us register this deviceUUID ... how did it disapper?
                            device = new req.app.models.HomeBeeDeviceModel({deviceUUID: uuid.v1(), deviceTYPE: req.body.deviceTYPE, version: req.body.version, chipId: req.body.chipId});
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
    /*
    {
      "code": 200,
      "data": {
        "firmware": {
          "__v": 0,
          "filename": "firmware-1473261914883.bin",
          "version": "1.1",
          "_id": "57d0315a97b90a2fd8497a56"
        }
      }
    }*/
    uploadFirmware: function(req, res, next){
      if (req.method=='POST'){
          var error = validateAddFirmware(req);
          if (error.length>0){
              var ret = {code: 401, error: 'invalid_request', error_description: error};
              res.json(ret);
              res.end();
          }else{
            req.app.models.HomeBeeDeviceFirmwareModel.findOne({deviceTYPE: req.body.deviceTYPE, version: req.body.version}, function(err, firmware){
              if (err){
                utils.apidebug(err);
                res.status(500);
                res.json({
                  "code": 600,
                  "error": "system_error",
                  "error_description": err
                });
                res.end();
              }else{
                if (firmware){
                  var filename = 'public/firmwares/'+firmware.filename;
                  fs.realpath(filename, function(err, p){
                    if (err){
                      utils.apidebug(err);
                    }else{
                      fs.unlinkSync(p);
                      utils.apidebug('deleted old file: '+p);
                    }
                  });
                  firmware.filename = req.file.filename;
                }else{
                  firmware = new req.app.models.HomeBeeDeviceFirmwareModel({
                      deviceTYPE: req.body.deviceTYPE,
                      filename: req.file.filename,
                      version: req.body.version
                    });
                }
                firmware.save(function(err, firmware){
                    if (err){
                      utils.apidebug(err);
                      res.status(500);
                      res.json({
                        "code": 600,
                        "error": "system_error",
                        "error_description": err
                      });
                      res.end();
                    }else{
                      utils.apidebug('Firmware created');
                      utils.apidebug(firmware);
                      res.status(200);
                      res.json({code: 200,
                        data: {
                          firmware: firmware,
                        }
                      });
                      res.end();
                    }
                });
              }
            })
          }
      }else{
          var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
          res.status(401);
          utils.apidebug(JSON.stringify(ret, null, 4));
          res.json(ret);
          res.end();
      }
    },
    addCommand: function(req, res, next){
      if (req.method=='POST'){
          var error = validateAddCommand(req);
          if (error.length>0){
              var ret = {code: 401, error: 'invalid_request', error_description: error};
              res.json(ret);
              res.end();
          }else{
            req.app.models.HomeBeeDeviceModel.findOne({deviceUUID: req.body.deviceUUID}, function(err, device){
              if (err || !device){
                utils.apidebug(err);
                res.status(500);
                res.json({
                  "code": 600,
                  "error": "system_error",
                  "error_description": (err)?err:'Device not found'
                });
                res.end();
              }else{
                var command = new req.app.models.HomeBeeDeviceCommandsModel({
                    device: device,
                    command: req.body.command,
                    createDate: new Date(),
                    pending: true
                  });
                command.save(function(err, command){
                    if (err){
                      utils.apidebug(err);
                      res.status(500);
                      res.json({
                        "code": 500,
                        "error": "system_error",
                        "error_description": err
                      });
                      res.end();
                    }else{
                      utils.apidebug('Command created');
                      utils.apidebug(command);
                      res.status(200);
                      res.json({code: 200,
                        data: {
                          command: command,
                        }
                      });
                      res.end();
                    }
                });
              }
            })
          }
      }else{
          var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
          res.status(401);
          utils.apidebug(JSON.stringify(ret, null, 4));
          res.json(ret);
          res.end();
      }
    },
    deviceCommandUpdate: function(req, res, next){
      if (req.method=='POST'){
          var error = validateDeviceCommandUpdate(req);
          if (error.length>0){
              res.status(401);
              var ret = {code: 401, error: 'invalid_request', error_description: error};
              res.json(ret);
              res.end();
          }else{
            utils.apidebug('command update from: '+req.userdevice.deviceUUID+" - "+req.body.commandId);
            req.app.models.HomeBeeDeviceCommandsModel.update(
              {_id: req.body.commandId},
              {
                $set: {
                  updateDate: new Date(),
                  pending: false
                }
              },
              function(err){
                if (err){
                  res.status(500);
                  res.json({
                    "code": 600,
                    "error": "system_error",
                    "error_description": err
                  });
                  res.end();
                }else{
                  utils.apidebug('Command updated');
                  res.status(200);
                  res.json({code: 200});
                  res.end();
                }
              }
            );
          }
      }else{
          var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
          res.status(401);
          utils.apidebug(JSON.stringify(ret, null, 4));
          res.json(ret);
          res.end();
      }
    },
    ping: function(req, res, next) {
      if (req.method=='POST'){
          var error = validatePing(req);
          if (error.length>0){
              var ret = {code: 401, error: 'invalid_request', error_description: error};
              res.json(ret);
              res.end();
          }else{
            res.status(200);
            utils.apidebug('ping received from: '+req.userdevice.deviceUUID+" - "+req.body.message);
            req.app.models.HomeBeeDeviceCommandsModel.find({device: req.userdevice, pending: true}).sort({createDate: -1}).exec(function(err, commands){
              if (err) {
                var ret = {code: 401, error: 'invalid_request', error_description: error};
                res.json(ret);
                res.end();
              }else{
                if (commands.length>0)
                res.status(200);
                res.json({code: 200,
                  data: {
                    device: req.userdevice,
                    command: (commands.length>0) ? commands[0]: {command: 'NONE'}
                  }
                });
                res.end();
              }
            })
          }
      }else{
          var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
          res.status(401);
          utils.apidebug(JSON.stringify(ret, null, 4));
          res.json(ret);
          res.end();
      }
    },
    update: function(req, res, next) {
      utils.apidebug(req.headers);
      var error = validateUpdate(req);
      if (error.length>0){
        res.status(401);
        var ret = {code: 401, error: 'invalid_request', error_description: error};
        res.json(ret);
        res.end();
      }else{
        var version = req.headers['x-esp8266-version'];
        if (typeof(version) == 'undefined') version = '1.0';
        utils.apidebug('version from: '+version);

        req.app.models.HomeBeeDeviceFirmwareModel.findOne({deviceTYPE: req.userdevice.deviceTYPE, version: {$gt: version}}, function(err, firmware){
          if (err){
            res.status(500),
            res.json({code: 500, error: 'system error', error_description: err});
            res.end();
          }else if (firmware){
            var filename = 'public/firmwares/'+firmware.filename;
            fs.realpath(filename, function(err, p){
              if (err){
                utils.apidebug(err);
              }else{
                var hash = md5File.sync(p);
                var stats = fs.statSync(p);
                var fileSizeInBytes = stats["size"]

                utils.apidebug('firmware file hash: '+hash);
                var options = {
                    root: '/',
                    dotfiles: 'deny',
                    cacheControl: false,
                    headers: {
                      'Content-Type': 'application/octet-stream',
                      'Content-Disposition': 'attachment; filename='+firmware.filename,
                      'Content-Length': fileSizeInBytes,
                      'x-ESP8266-VERSION': firmware.version,
                      'x-MD5': hash
                    }
                  };
                  res.sendFile(p, options, function (err) {
                    if (err) {
                      utils.apidebug(err);
                      res.status(err.status).end();
                    }else{
                      utils.apidebug('Sent:' + p);
                    }
                  });
                // fs.readFile( p, function( err, data ) {
                //   if( err ) {
                //     utils.apidebug(err);
                //     res.status(500);
                //     res.send({
                //       code: 500,
                //       data: {firmware: firmware}
                //     });
                //   }else{
                //     res.set('Content-Type', 'application/octet-stream' );
                //     res.set('Content-Disposition', 'attachment; filename='+firmware.filename );
                //     res.set( 'Content-Length', data.length );
                //     res.set('X_ESP8266_VERSION', firmware.version );
                //     res.set( 'x-MD5', hash );
                //     res.status( 200 );
                //     res.sendFile(p);
                //     res.end();
                //   }
                // });
              }
            });
          }else{
            res.status(304),
            res.set('Not Modified');
            res.json({code: 304});
            res.end();
          }
        });
      }
    },
  }
