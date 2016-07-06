var async = require('async');
var utils = require('./utils');
var path = require('path');
var crypto = require('crypto');

function validateUserRegisterRequest(req){
    var error = new Array();
    if (!utils.getRequestParam(req, 'code')) error.push('No Code found!');
    if (!utils.getRequestParam(req, 'name')) error.push('No Name found!');
    if (!utils.getRequestParam(req, 'mobile')) error.push('No Mobile Number found!');
    if (!utils.getRequestParam(req, 'email')) error.push('No Email Address found!');
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
                    if (req.body.deviceid || req.query.deviceid){
                        req.app.devices.DeviceModel.findOne({deviceid: req.body.deviceid || req.query.deviceid, clientid: req.oauth.bearerToken.clientId}).populate('user').exec(function (err, device) {
                            if (err) callback(err);
                            else{
                                utils.debug('device requesting:')
                                utils.debug(device);
                                if (!device) callback("Sorry, device not registered with JungleBee");
                                else{
                                    req.userdevice = device;
                                    callback();
                                }
                            }
                        });
                    }else{
                        callback('Sorry, you must provide device id in every request')
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
    user: function(req, res, next){
        switch(req.path) {
        case '/register':
            if (req.method=='POST'){
                var error = validateUserRegisterRequest(req);
                if (error.length>0){
                    var ret = {code: 401, error: 'invalid_request', error_description: error};
                    res.json(ret);
                    res.end();
                }else{
                    var confirm_code = utils.getRequestParam(req, 'code');
                    var mobile = utils.getRequestParam(req, 'mobile');
                    var email = utils.getRequestParam(req, 'email');
                    var name = utils.getRequestParam(req, 'name');
                    utils.debug('registering: '+name+' '+email+' '+mobile);
                    async.auto({
                        find_code: function(callback){
                            utils.apidebug('confirming code: '+confirm_code);
                            var criteria = {user: req.userdevice.user._id, code: confirm_code, used: false, expires: { '$gt': new Date()}};
                            utils.apidebug(criteria);
                            utils.apidebug('now searching');
                            req.app.devices.CodeModel.findOne(criteria, function(err, code){
                                utils.apidebug('code found: ');
                                utils.apidebug(code);
                                if (err) callback(err);
                                else if (!code) callback('Code might have expired!');
                                else callback(null, code);
                            });
                        },
                        update_user: ['find_code', function(callback, results){
                            var code = results['find_code'];
                            req.userdevice.user.name = name;
                            req.userdevice.user.mobile = mobile;
                            req.userdevice.user.email = email;
                            req.userdevice.user.save(function(err){
                                if (err) callback(err);
                                else {
                                    utils.apidebug('user updated: ');
                                    utils.apidebug(req.userdevice.user);
                                    code.used = true; // set as used
                                    code.save(function(err){
                                        if (err) callback(err);
                                        else{
                                            utils.apidebug('code marked as used:');
                                            utils.apidebug(code);
                                            req.userdevice.deepPopulate('user', function(err, device){
                                                callback(err, device);
                                            });
                                        }
                                    })
                                }
                            })

                        }]
                    }, function(err, results) {
                        if (err){
                            var ret = {code: 401, error: 'invalid_request', error_description: err};
                            res.json(ret);
                            res.end();
                        }else{

                            var ret = {code: 200, data: results['update_user']};
                            res.json(ret);
                            res.end();

                        }
                    });
                }
            }else{
                var ret = {code: 401, error: 'invalid_request', error_description: 'Need POST request for this API call'};
                res.json(ret);
                res.end();
            }
            break;
        default:
            break;
        }
    }
}
