var GoogleMapsAPI = require('googlemaps');
var fs = require('fs');
var path = require('path');
var ejs = require('ejs');
var args = require('yargs').argv;
var stringify = require('json-stringify-safe');
var email   = require("emailjs/email");
var junglebeemailserver  = email.server.connect({
   user:    "junglebee@surya-solutions.com", 
   password:"Jungl3B33", 
   host:    "mail.surya-solutions.com", 
    ssl:     false,
    port: 587
});
var supplierbeemailserver  = email.server.connect({
   user:    "supplierbee@surya-solutions.com", 
   password:"Suppl13rB33", 
   host:    "mail.surya-solutions.com", 
    ssl:     false,
    port: 587
});
//Suppl13rB33

var emailtemplatepath = path.join(__dirname, '../views/email/');

var intel = require('intel');

var exceptions = intel.getLogger('exception');
exceptions.addHandler(new intel.handlers.File({
        'class': intel.handlers.File,
        'file': './logs/exception.log',
        'formatter': new intel.Formatter({
            'format': '\n[%(date)s] %(levelname)s: %(message)s \n%(exception)s %s(uncaughtException)s %(stack)s',
            'strip': true
        })
    }));
exceptions.handleExceptions(true);


var alllogs = intel.getLogger('log');
alllogs.addHandler(new intel.handlers.File({
        'class': intel.handlers.File,
        'file': './logs/junglebee.log',
        'formatter': new intel.Formatter({
            'format': '[%(date)s] %(levelname)s: %(message)s',
            'strip': true
        })
    }));
var apilogs = intel.getLogger('api');
apilogs.addHandler(new intel.handlers.File({
        'class': intel.handlers.File,
        'file': './logs/api.log',
        'formatter': new intel.Formatter({
            'format': '[%(date)s] %(levelname)s: %(message)s',
            'strip': true
        })
    }));
var importlogs = intel.getLogger('import');
importlogs.addHandler(new intel.handlers.File({
        'class': intel.handlers.File,
        'file': './logs/import.log',
        'formatter': new intel.Formatter({
            'format': '[%(date)s] %(levelname)s: %(message)s',
            'strip': true
        })
    }));
// alpha.setLevel(intel.WARN).addHandler(new intel.handlers.File('./logs/alpha.log'));

var googlemapskey = 'AIzaSyDVwhRhjyNkBMWtRlvPJyVvYPcqFK74aVc';
var googleMapsConfig = {
  key: googlemapskey,
  stagger_time:       1000, // for elevationPath 
  encode_polylines:   false,
  secure:             true // use https 
};

var gmAPI = new GoogleMapsAPI(googleMapsConfig);

module.exports = {
    args: args,
    getObjectHasKeyValues: function(key, value, arrObject){
        var ret = new Array();
        arrObject.forEach(function(obj){
            if (obj[key] == value)
                ret.push(obj);
        });
        return ret;
    },
    debugApiRequest: function(req, res, next){
        if (req.query.debug){
            apilogs.debug('Original URL: '+ req.originalUrl);
            apilogs.debug('Method: ' + req.method);
            apilogs.debug('Query: ' + JSON.stringify(req.query, null, 4));
            apilogs.debug('Body Parameters: '+ JSON.stringify(req.body, null, 4));
            apilogs.debug('Headers: '+ JSON.stringify(req.headers, null, 4));
            if (req.files && req.is('multipart/form-data'))             
                apilogs.debug('Files: '+ JSON.stringify(req.files, null, 4));

        }
        next();
    },
    debug: function(text){
        // console.log(text);
        if (args.log == 'debug' || true) alllogs.debug((typeof text === 'object') ? stringify(text, null, 4) : text);
    },
    error: function(text){
        // console.log(text);
        alllogs.error((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    info: function(text){
        // console.log(text);
        if (args.log == 'info' || args.log == 'debug'  || true) alllogs.info((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    importdebug: function(text){
        // console.log(text);
        if (args.log == 'debug'  || true) importlogs.debug((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    importerror: function(text){
        // console.log(text);
        importlogs.error((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    importinfo: function(text){
        // console.log(text);
        if (args.log == 'info' || args.log == 'debug'  || true) importlogs.info((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    apidebug: function(text){
        // console.log(text);
        if (args.log == 'debug'  || true) apilogs.debug((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    apierror: function(text){
        // console.log(text);
        apilogs.error((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    apiinfo: function(text){
        // console.log(text);
        if (args.log == 'info' || args.log == 'debug' || true) apilogs.info((typeof text === 'object') ? JSON.stringify(text, null, 4) : text);
    },
    stream : {
        write: function(message, encoding){
            logger.info(message);
        }
    },
    // geocode API -- either one or more 
    // {
    //   "address":    "121, Curtain Road, EC2A 3AD, London UK",
    //   "components": "components=country:GB",
    //   "bounds":     "55,-1|54,1",
    //   "language":   "en",
    //   "region":     "uk"
    // }
    // returns following;
    // {
    //     "formatted_address": "110 Westborough Rd, Maidenhead, Windsor and Maidenhead SL6 4AT, UK",
    //     "location": {
    //         "lat": 51.5169572,
    //         "lng": -0.7417195999999999
    //     }
    // }
    geocode : function(geocodeParams, callback){
        gmAPI.geocode(geocodeParams, function(err, result){
            // console.log(JSON.stringify(result, null, 4));
            
            if (err ){
                module.exports.error(err);  
                callback(err);
            } else if (result.status != 'OK'){
                module.exports.error('Google Maps returned ['+result.status+'] when looking up ['+JSON.stringify(geocodeParams, null, 4)+']');
                callback('Google Maps returned status not OK');
            }else{
                if (result.results.length>0){
                    module.exports.debug(JSON.stringify(result.results[0], null, 8));
                    var ret = {};
                    ret.formatted_address = result.results[0].formatted_address;
                    ret.location = result.results[0].geometry.location;
                    //now extract Post code
                    for(i=0; i<result.results[0].address_components.length; i++){
                        for(j=0; j<result.results[0].address_components[i].types.length; j++){
                            if (result.results[0].address_components[i].types[j] == 'postal_code'){
                                ret.postcode = result.results[0].address_components[i].short_name;
                            }
                        }    
                    }
                    // console.log(JSON.stringify(ret, null, 4));
                    callback(null, ret);
                }else{
                    callback('No address found');
                }
            }
        });
    },
    // // reverse geocode API latlng required rest optional
    // var reverseGeocodeParams = {
    //   "latlng":        "51.1245,-0.0523",
    //   "result_type":   "postal_code",
    //   "language":      "en",
    //   "location_type": "APPROXIMATE"
    // };
    reverseGeocode: function(reverseGeocodeParams, callback){
        gmAPI.reverseGeocode(reverseGeocodeParams, function(err, result){
            if (err ){
                module.exports.logger.error(err);  
                callback(err);
            } else if (result.status != 'OK'){
                module.exports.logger.error('Google Maps returned status not OK while reverseGeocoding for:');
                module.exports.logger.error(JSON.stringify(reverseGeocodeParams, null, 4));
                module.exports.logger.error(JSON.stringify(result, null, 4));
                callback('Google Maps returned status not OK');
            }else{
                if (result.results.length>0){
                    // module.exports.logger.debug(JSON.stringify(result.results[0], null, 8));
                    var ret = {};
                    ret.formatted_address = result.results[0].formatted_address;
                    ret.location = result.results[0].geometry.location;
                    // module.exports.logger.debug(JSON.stringify(ret, null, 4));
                    callback(null, ret);
                }else{
                    callback('No address found');
                }
            }
        });
    },
    getRandomInteger: function(numOfDigits){
        //size is number of digits
        var min = Math.pow(10, numOfDigits-1);
        var max = Math.pow(10, numOfDigits) -1;
        var num = Math.floor(Math.random() * (max - min + 1)) + min;
        return num;
    },
    // 1 hour window to recover
    getRecoverExpiry: function(){
        return new Date().getTime()+(3600 *1000)
    },
    // 1 hour window to recover
    getCodeExpiry: function(){
        return new Date().getTime()+(3600 *1000)
    },
    getRequestParam: function(req, param){
        return req.body[param] || req.query[param];
    },
    sendEmail: function(to, subject, data, htmltemplatefile, texttemplatefile, jobfiles, type, callback){
        var from = 'supplierbee@surya-solutions.com';
        if (type=='user'){
            from = 'junglebee@surya-solutions.com';
        }
        var html = null, text=null;
        if (htmltemplatefile){
            var htmltemplate = fs.readFileSync(emailtemplatepath + htmltemplatefile, "utf8");
            var html = ejs.render(htmltemplate, data);
        }
        if (texttemplatefile){
            var texttemplate = fs.readFileSync(emailtemplatepath + texttemplatefile, "utf8");
            var text = ejs.render(texttemplate, data);
        }
        if (!html && !text){
            callback('Need atleast HTML or TEXT file template to send email');
        }else{
            var message = {
               text:    text, 
               from:    from, 
               to:      to,
               subject: subject,
               attachment: 
               [
                   {data:html, alternative:true}
               ]
            };
            // JobFileModel
            if (jobfiles){
                var uploadpath = path.join(__dirname, '../public/uploads/');
                for(i=0; i<files.length; i++){
                    //JobFileSchema
                    message.attachement.push({path: uploadpath+files[i].filename, type:files[i].type, name: files[i].filename});
                }
            }
            module.exports.debug(type);
            if (type=='supplier'){
                supplierbeemailserver.send(message, function(err, message) {
                    if (err) module.exports.debug(err);
                    else module.exports.debug('email sent successfully');
                    callback(err);
                });            
            }else{
                junglebeemailserver.send(message, function(err, message) {
                    if (err) module.exports.debug(err);
                    else module.exports.debug('email sent successfully');
                    callback(err);
                });            
            }
        }
    },
    renderTemplate: function(templatefile, data){
        var template = fs.readFileSync(templatefile, "utf8");
        var text = ejs.render(template, data);
        return text;
    }
}
