/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var db = require('./dbconnection'),
  mongoose = require('mongoose'),
  async = require('async'),
  Schema = mongoose.Schema,
  model = module.exports,
  deepPopulate = require('mongoose-deep-populate')(mongoose),
  utils = require('../controllers/utils');

// var uristring = 'mongodb://localhost/oauth2';
//
// // Makes connection asynchronously. Mongoose will queue up database
// // operations and release them when the connection is complete.
// mongoose.connect(uristring, function (err, res) {
//     if (err) {
//         debug('ERROR connecting to: ' + uristring + '. ' + err);
//     } else {
//         debug('Succeeded connected to: ' + uristring);
//     }
// });
//
// Schemas definitions
//
var OAuthAccessTokensSchema = new mongoose.Schema({
  accessToken: { type: String },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthRefreshTokensSchema = mongoose.Schema({
  refreshToken: { type: String },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthClientsSchema = new mongoose.Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUri: { type: String }
});

var OAuthUsersSchema = new mongoose.Schema({
  username: { type: String },
  password: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String }
});

var OAuthUserRolesSchema = new mongoose.Schema({
    userId: { type: String },
    clientId: { type: String },
    role: { type: String }
});
var HomeBeeDeviceSchema = new mongoose.Schema({
    deviceUUID: String,
    deviceTYPE: String,
    version: String,
    status: String,
    command: String,
    lastUpdate: Date,
    chipId: String,
    user:{ type:mongoose.Schema.ObjectId, ref:"OAuthUsers" }
});
HomeBeeDeviceSchema.plugin(deepPopulate, {});

// mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);
// mongoose.model('OAuthRefreshTokens', OAuthRefreshTokensSchema);
// mongoose.model('OAuthClients', OAuthClientsSchema);
// mongoose.model('OAuthUsers', OAuthUsersSchema);
// mongoose.model('OAuthUserRoles', OAuthUserRolesSchema);

var OAuthAccessTokensModel = db.oauth2.model('OAuthAccessTokens', OAuthAccessTokensSchema),
    OAuthRefreshTokensModel = db.oauth2.model('OAuthRefreshTokens', OAuthRefreshTokensSchema),
    OAuthClientsModel = db.oauth2.model('OAuthClients', OAuthClientsSchema),
    OAuthUsersModel = db.oauth2.model('OAuthUsers', OAuthUsersSchema),
    OAuthUserRolesModel = db.oauth2.model('OAuthUserRoles', OAuthUserRolesSchema),
    HomeBeeDeviceModel = db.oauth2.model('HomeBeeDevice', HomeBeeDeviceSchema);

module.exports.HomeBeeDeviceModel = HomeBeeDeviceModel;
module.exports.OAuthUsersModel = OAuthUsersModel;
module.exports.OAuthUserRolesModel = OAuthUserRolesModel;
module.exports.OAuthClientsModel = OAuthClientsModel;

db.oauth2.on('connected', function (db) {
  utils.apidebug("Checking OAUTH DB setup ...");
  utils.eventEmitter.emit('oauth2-dbconnected', {
    OAuthClientsModel: OAuthClientsModel,
    OAuthUsersModel: OAuthUsersModel,
    OAuthUserRolesModel: OAuthUserRolesModel,
    HomeBeeDeviceModel: HomeBeeDeviceModel
  }, utils.apidebug);
});
//
// oauth2-setup -- verify super admin user, clientId in database
//
//
// oauth2-server callbacks
//
module.exports.getAccessToken = function (bearerToken, callback) {
  // debug('in getAccessToken (bearerToken: ' + bearerToken + ')');
  async.series([
      function(callbak){
          OAuthAccessTokensModel.findOne({ accessToken: bearerToken }, function(err, token){
              if (err)
                  callback(err);
              else
                  callback(null, token);
          });
      }],
      function(err){

      }
  );
};

module.exports.getClient = function (clientId, clientSecret, callback) {
  // debug('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
  if (clientSecret === null) {
    return OAuthClientsModel.findOne({ clientId: clientId }, callback);
  }
  OAuthClientsModel.findOne({ clientId: clientId, clientSecret: clientSecret }, callback);
};
// // Santosh added
// module.exports.getAllClients = function (callback) {
//     OAuthClientsModel.find(callback);
// };
// //get a user to edit
// module.exports.findClientById = function (id, callback) {
//     OAuthClientsModel.findOne({ _id: id}, function(err, client) {
//       if(err) return callback(err);
//       callback(null, client);
//     });
// };
//
// module.exports.addClient = function (clientId, clientSecret, callback) {
//   // debug('in add Client (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
//   var thisClient = null;
//   async.series([
//       function(callback){
//           OAuthClientsModel.findOne({clientId: clientId}, function(err, client){
//               if (err) {
//                   utils.debug('error in findOne '+err);
//                   callback(err);
//               }
//               if (client) {
//                   utils.debug('found existing client');
//                   callback('Sorry, clientId: "'+clientId+'" already exists');
//               }else{
//                   utils.debug('no client found');
//                   callback();
//               }
//           });
//       },
//       function(callback){
//           utils.debug('new client being added.');
//           var client = new OAuthClientsModel();
//           client.clientId = clientId;
//           client.clientSecret = clientSecret;
//           client.clientUri = '';
//           client.save(function(err) {
//               if (err)
//                   callback(err);
//               else
//                   callback();
//             });
//       }],
//       function(err){
//           if (err){
//               callback(err);
//           } else {
//               callback();
//           }
//       }
//   );
//
// };
//
// module.exports.deleteClient = function(id, callback){
//     OAuthClientsModel.remove({_id: id}, function(err){
//         if (err)
//             callback(err.message);
//         else
//             callback();
//     });
// };
// -- end
// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
// var authorizedClientIds = ['s6BhdRkqt3', 'toto', 'JungleBee'];
module.exports.grantTypeAllowed = function (clientId, grantType, callback) {

  if (grantType === 'password' || grantType === 'refresh_token') {
      return callback(false, true);
  }

  return callback(false, true);
};

module.exports.saveAccessToken = function (token, clientId, expires, userId, callback) {
  // utils.debug('in saveAccessToken (token: ' + token + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');
  if (typeof userId === 'object') { userId = userId.id }
  var accessToken = new OAuthAccessTokensModel({
    accessToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  accessToken.save(function(err){
    if (err) utils.debug(err);
    callback(err);
  });
}
/*
 * Required to support password grant type
 */
module.exports.getUser = function (username, password, callback) {
  utils.debug('in getUser (username: ' + username + ', password: ' + password + ')');

  OAuthUsersModel.findOne({ username: username, password: password }, function(err, user) {
    if(err) callback(err);
    else if(user) callback(null, user._id);
    else callback(null, null);

  });
};
module.exports.getUserObject = function (username, password, callback) {
  utils.debug('in getUserObject (username: ' + username + ', password: ' + password + ')');
  OAuthUsersModel.findOne({ username: username, password: password }, function(err, user) {
    if(err) callback(err);
    else if(user) callback(null, user);
    else callback(null, null);

  });
};
/*
 * Required to support refreshToken grant type
 */
module.exports.saveRefreshToken = function (token, clientId, expires, userId, callback) {
  // utils.debug('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +', userId: ' + userId + ', expires: ' + expires + ')');
  if (typeof userId === 'object') { userId = userId.id }
  var refreshToken = new OAuthRefreshTokensModel({
    refreshToken: token,
    clientId: clientId,
    userId: userId,
    expires: expires
  });

  refreshToken.save(callback);
};

module.exports.getRefreshToken = function (refreshToken, callback) {
  OAuthRefreshTokensModel.findOne({ refreshToken: refreshToken }, callback);
};

//additional methods
module.exports.loginUser = function (user, password, callback) {
  utils.debug('in getUserEmailPassword (email: ' + user + ', password: ' + password + ')');
  return new Promise(function(resolve, reject){
    OAuthClientsModel.findOne({clientId: 'HomeBeeApp'}).exec()
      .then(function(client){
        OAuthUsersModel.findOne(
          { $or: [
            { email: user, password: password },
            {username: user, password: password}
            ]
          }).exec()
          .then(function(user) {
            if(user) {
              OAuthUserRolesModel.find({clientId: client._id, userId: user._id}).lean().exec()
                .then(function(userroles){
                  user = user.toJSON();
                  user.roles = [];
                  if (userroles){
                    userroles.forEach(function(role){
                      user.roles.push(role.role);
                    });
                    resolve(user);
                  }else{
                    reject("System Error getting user roles");
                  }
                })
                .catch(function(err){
                  reject(err);
                });
            } else {
              reject('user not found');
            }
          })
          .catch(function(err){
              reject(err);
          })
      })
      .catch(function(err){
          reject(err);
      })
  });
};
