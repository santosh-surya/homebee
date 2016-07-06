//assumes that the token is available in a hidden field on the page id="access_token"
//if not it does not call the API
//url: /1.0/ - the version is automatically prepended to the calling url 
//     Include all the query string parameters in params when calling this function
var APIVERSION = '1.0'
function getAPI(token, url, params, callback){
    var err = false;
        if (token.length>0){
            $.ajax({
                url: "/"+APIVERSION+url+"?"+$.param(params),
                headers: { 'Authorization': 'Bearer '+ token},
            }).done(function( data ) {
                callback(data);
            }).fail(function(data) {
                alert( "error in getting coordinates ... please try later "+responseText );
                callback({code: 401, error: 'invalid_request', error_description: err});
            });
        }else{
            err = 'Token not found';
        }
    if (err){
        callback({code: 401, error: 'invalid_request', error_description: err});
    }
}