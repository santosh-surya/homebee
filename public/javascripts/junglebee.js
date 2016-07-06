window.setTimeout(function() {
    $(".autohide").slideUp(500, function(){
        $(this).remove(); 
    });
}, 5000);

function updateServiceGeocode(){
    var address = document.getElementById('address').value.trim();
    if (address.length>0){
        if (document.getElementById('access_token')){
            var token = document.getElementById('access_token').value;
            document.getElementById('find-geocode').disabled = true;
            getAPI(token, '/api/utils/getgeocode', {address: address}, function(data){
                document.getElementById('find-geocode').disabled = false;
                if (data.code == 200){
                    document.getElementById('address').value = data.address;
                    document.getElementById('lattitude').value = data.lattitude;
                    document.getElementById('longitude').value = data.longitude;
                }else{
                    alert('Error: '+ data.error_description);
                }
            })
        }else{
            alert('Token not in document');
        }
    }else{
        alert('Error: \n'+ err );
    }
}