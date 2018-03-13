var chrono = require('chrono-node')
var axios = require('axios')

var instance = axios.create({
    baseURL: 'http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?',
    headers: {'Accept':'application/json'}
  });

exports.getConversation = function(text,cb) {
    let date=chrono.parseDate(text) 
    console.log("parsed to string:--",date)
    // console.log("parsed to string:--",date.toString())
    
    if(date){
        cb(null, {action:"insert",text:"Your appointment is booked on "+date.toString(),date:date});
    }else
        cb(null, "No date found" );
        // cb(null, "I would call it " + parsed.out('text'));

}

exports.getListAppointment = function(text,cb) {
    console.log("parsed to text:--",text)
    
    // if(!text || text.length===0)
    //     text='Today' 
    let date=chrono.parseDate(text) 
    console.log("parsed to string:--",date)
    // console.log("parsed to string:--",date.toString())
    
    if(date){
        let message=this.message
        let indexOf=(message.words).indexOf("upcoming")
        if(indexOf==-1){
            cb(null, {action:"get",text:"List of allappointment is booked on "+date.toString(),date:date});
        }else{
            cb(null, {action:"upcoming_get",text:"List of all upcoming appointment is booked on "+date.toString(),date:date});
        }
    }else{
        cb(null, "No date found" );
        // cb(null, "I would call it " + parsed.out('text'));
    }
};    
  
exports.getDeleteAppointment = function(text,cb) {
    
    let date=chrono.parseDate(text) 
    console.log("parsed to string:--",date)
    // console.log("parsed to string:--",date.toString())
    
    if(date){
        // that.message.props['color'] = "insert";
        cb(null, {action:"delete",text:"Delete all appointment booked on "+date.toString(),date:date});
    }else
        cb(null, "No date found" );
        // cb(null, "I would call it " + parsed.out('text'));
};
  
  
exports.isDateAvailable=function(value,cb) {    
    console.log("Value:--",value)
    let date=chrono.parseDate(value) 
    console.log("Date:--",date)
    if(date)
        cb(null,true)
        else
        cb(null,false)
}

exports.getMapLocation=function (cb) {
    let d=`<html>
    <body>
    
    <h1>We found your current location</h1>
    
    <div id="map" style="width:200px;height:150px;background:yellow"></div>
    
    <script>
    function myMap() {
    var mapOptions = {
        center: new google.maps.LatLng(22,73),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.HYBRID
    }
    var map = new google.maps.Map(document.getElementById("map"), mapOptions);
    }
    </script>
    
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCcxdVJ4HDr3orO0NCJu-7pQZDJLIuJCJM&callback=myMap"></script>

    </body>
    </html>`

    cb(null,d.toString())
}

exports.getDbPediaSearch=function (text,cb) {   
    
    axios.get('http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?QueryClass=&QueryString='+text)
        .then(function (response) {

            let result=response.data;
            if(result){
                let resultArray=result.results;

                if(resultArray.length>0)
                {
                    let dataObj=resultArray[0]
                    cb(null,dataObj.label+" ---> "+dataObj.description)    
                }else{
                    cb(null,"Let's talk about another topic.")    
                }
            }else{
                cb(null,"Let's talk about another topic.")   
            }

        })
        .catch(function (error) {
            console.log(error);
        });
}

exports.getDbPediaSearch=function (text,cb) {   
    
    axios.get('http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?QueryClass=&QueryString='+text)
        .then(function (response) {

            let result=response.data;
            if(result){
                let resultArray=result.results;

                if(resultArray.length>0)
                {
                    let dataObj=resultArray[0]
                    cb(null,dataObj.label+" ---> "+dataObj.description)    
                }else{
                    cb(null,"Let's talk about another topic.")    
                }
            }else{
                cb(null,"Let's talk about another topic.")   
            }

        })
        .catch(function (error) {
            console.log(error);
        });
    
}