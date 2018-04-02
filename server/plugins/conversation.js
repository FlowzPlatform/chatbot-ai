var nlp = require('compromise')
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
}
  
  
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

exports.getDbPediaSearch= function (text,cb) {   
    console.log("Message:--",this.message)
    axios.get('http://lookup.dbpedia.org/api/search.asmx/KeywordSearch?QueryClass=&QueryString='+text)
        .then(function (response) { 

            let result=response.data;
            if(result){
                let resultArray=result.results;

                if(resultArray.length>0)
                {
                    let dataObj=resultArray[0]

                    callDBPediaAPI(dataObj,cb)
                    // console.log("response.dbpedia:--> ",resultDbPedia)
                    
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

 function callDBPediaAPI(dataObj,cb) {
    console.log("response.data:--> ",dataObj.uri)

    let BASE_URL="http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="
    let QUERY_PREFIX=`PREFIX owl: <http://www.w3.org/2002/07/owl#>
                    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
                    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
                    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
                    PREFIX foaf: <http://xmlns.com/foaf/0.1/>
                    PREFIX dc: <http://purl.org/dc/elements/1.1/>
                    PREFIX : <http://dbpedia.org/resource/>
                    PREFIX dbpedia2: <http://dbpedia.org/property/>
                    PREFIX dbpedia: <http://dbpedia.org/>
                    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
                    PREFIX onto: <http://dbpedia.org/ontology/>
                    PREFIX purl: <http://purl.org/dc/terms/>`

    callDBPediaResourcesCategory(BASE_URL,QUERY_PREFIX,dataObj.uri,callDbPediaResoucesType,cb)

    // var QUERY_URL=`PREFIX owl: <http://www.w3.org/2002/07/owl#>
    //             PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    //             PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    //             PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    //             PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    //             PREFIX dc: <http://purl.org/dc/elements/1.1/>
    //             PREFIX : <http://dbpedia.org/resource/>
    //             PREFIX dbpedia2: <http://dbpedia.org/property/>
    //             PREFIX dbpedia: <http://dbpedia.org/>
    //             PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    //             PREFIX onto: <http://dbpedia.org/ontology/>
    //             select distinct ?property ?label {
    //                     { <`+dataObj.uri+`> ?property ?o }
    //                     union
    //                     { ?s ?property <`+dataObj.uri+`>}
                    
    //                     optional { 
    //                     ?property <http://www.w3.org/2000/01/rdf-schema#label> ?label .
    //                     filter langMatches(lang(?label), 'en')
    //                     }
    //                 }`

    // let mainUrl=BASE_URL+encodeURIComponent(QUERY_URL.replace(/\n+/g,''))+'&output=json';
    // // console.log("Main Url:--",mainUrl)
    // axios.get(mainUrl).then(result=>{
    //     // console.log("Result:--",result)
    //     // console.log("Result1:--",JSON.stringify(result.data.results.bindings))

    //     if(result.data.results.bindings)
    //     {
    //         let arrayTypes=result.data.results.bindings;


    //         let dataQuery=`PREFIX owl: <http://www.w3.org/2002/07/owl#>
    //         PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    //         PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    //         PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    //         PREFIX foaf: <http://xmlns.com/foaf/0.1/>
    //         PREFIX dc: <http://purl.org/dc/elements/1.1/>
    //         PREFIX : <http://dbpedia.org/resource/>
    //         PREFIX dbpedia2: <http://dbpedia.org/property/>
    //         PREFIX dbpedia: <http://dbpedia.org/>
    //         PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    //         PREFIX onto: <http://dbpedia.org/ontology/>
    //         PREFIX purl: <http://purl.org/dc/terms/>
    //         select * where {
    //         `
    //             console.log("category length:--",resourcesCategory)
    //             resourcesCategory.forEach(element => {
    //                 dataQuery= dataQuery.concat(' ?subject purl:subject <'+element.uri+'> .' )
    //             });


    //             dataQuery=dataQuery.concat(' ?subject onto:abstract ?abstract }')
                
    //         // arrayTypes.forEach(element => {
    //         //     // console.log("element:--",element)
    //         //     let property=element.property;
    //         //     let label=element.label;

    //         //     let pValue=property.value;
    //         //     let lastSegment=pValue.substr(pValue.lastIndexOf('/') + 1);
    //         //     dataQuery=  dataQuery.concat(' ?subject <'+pValue+'> ?'+lastSegment+ ' .' )


    //         // });
    //         let dataUrl=BASE_URL+encodeURIComponent(dataQuery.replace(/\n+/g,''))+'&output=json';

    //         axios.get(mainUrl).then(result=>{
    //             console.log("dataUrl:--",dataUrl)
    //         });
    //         console.log("Log:-->",dataQuery)
    //     }

    // })

    // dataObj.uri="http://dbpedia.org/resource/Mahatma_Gandhi"
    //   axios.get('http://localhost:5000/graphql?query={person{personalinfo(resourcesId:"'+dataObj.uri+'"){alias,spouse,birthDate,birthPlace,name,gender,abstract,deathdate,familyMoreInfo{fatherName,fatherBirthDate,motherName,spouseBirthDate}}}}')
    // .then(function (response) {
    //     // console.log("response.data:--> ",JSON.stringify(response.data))
    //     var json=response.data;
    
    //     let personalinfo=json.data.person.personalinfo;
    //     let resMsg=dataObj.label+" ---> "+dataObj.description +
    //             " Person Name:-->"+personalinfo.name+
    //             " Person birthdate:-->"+personalinfo.birthDate+
    //             " Person spouse:-->"+personalinfo.spouse+
    //             " Person alias:-->"+personalinfo.alias+
    //             " Person birthPlace:-->"+personalinfo.birthPlace+
    //             " Person deathdate:-->"+personalinfo.deathdate+
    //             " Person gender:-->"+personalinfo.gender
    //     cb(null,resMsg)    
       

    // })
    // .catch(function (error) {
    //     console.log(error);
    // });
}

 function callDBPediaResourcesCategory(baseURL,queryPrefix,resourceId,cb,rCb) {
    console.log("callDBPediaResourcesCategory: --",resourceId)
    let QUERY_URL=`SELECT *
            WHERE {<`+resourceId+`> <http://purl.org/dc/terms/subject> ?categories }`
    
    let mainUrl=baseURL + encodeURIComponent( (queryPrefix + QUERY_URL).replace(/\n+/g,''))+'&output=json';
    
    // console.log("Category Url:--",mainUrl)
     axios.get(mainUrl).then(result=>{
        let bindings=result.data.results.bindings;
        // console.log("Category: --",bindings)
        cb(baseURL,queryPrefix,resourceId,bindings,callDbPediaSnorql,rCb);
    }).catch(error=>{
        console.log("Category Error:  --",error)
    })


}

function callDbPediaResoucesType(baseURL,queryPrefix,resourceId,categories,cb,rCb) {
    console.log("callDbPediaResoucesType: --")
    let QUERY_URL=` select distinct ?property ?label {
        { <`+resourceId+`> ?property ?o }
        union
        { ?s ?property <`+resourceId+`>}
    
        optional { 
        ?property <http://www.w3.org/2000/01/rdf-schema#label> ?label .
        filter langMatches(lang(?label), 'en')
        }
    }`

    let mainUrl=baseURL + encodeURIComponent( (queryPrefix + QUERY_URL).replace(/\n+/g,''))+'&output=json';


    axios.get(mainUrl).then(result=>{
            let bindings=result.data.results.bindings;
            // console.log("Types: --",bindings)
            cb(baseURL,queryPrefix,resourceId,categories,bindings,rCb);
    })
}

function callDbPediaSnorql(baseURL,queryPrefix,resourceId,categories,arrayTypes,rCb) {
    let dataQuery=`select * where { `

    categories.forEach(element => {
        dataQuery= dataQuery.concat(' ?subject purl:subject <'+element.categories.value+'> .' )
        
    });

    let primisesArray=[];
    var resultArray={text:'Result found'};
   var resultObj={}
    arrayTypes.forEach(element => {
        
        // console.log("element:--",element)
        let property=element.property;
        let label=element.label;
        if(label){
        let pValue=property.value;
        let lastSegment=pValue.substr(pValue.lastIndexOf('/') + 1);
       let  hasQuery=  dataQuery.concat(' ?subject <'+pValue+'> ?'+lastSegment)
            if(lastSegment==='abstract')
                hasQuery=  hasQuery.concat(" filter langMatches(lang(?abstract), 'en')")
                hasQuery=  hasQuery.concat(" }")
       //+ ' filter langMatches(lang(?label), \'en\') }' )
    //    hasQuery=hasQuery.concat(' filter(langMatches(lang(?'+lastSegment+'),"en"))} ')

        let mainUrl=baseURL + encodeURIComponent( (queryPrefix + hasQuery).replace(/\n+/g,''))+'&output=json';
       
        // let promise = new Promise(function(resolve, reject) {
        //     poll(() => axios.get(mainUrl).then(validate)
        //    axios.get(mainUrl).then(result=>{
        //         let bindings=result.data.results.bindings;
        //         // console.log("Resilt : "+lastSegment+"-->>",bindings)
        //         if(bindings.length>0){
        //         let resultBind=bindings[0];
        //         let value=resultBind[lastSegment].value
        //         console.log("Last Rsult:--"+ lastSegment +'--->'+value)
        //         var data={}
        //         data[lastSegment]=value;

        //             resolve(data)
        //         // resultArray[lastSegment]=value
        //         }
        //         // rCb(null,{text:resultAbstact});
        //     }).catch(error=>{
        //         console.log("Error:-- ",error.message)
        //         // rCb(null,"error");
        //         var data={}
        //         data[lastSegment]='';
        //             resolve({'key':'value'})
        //     })
        //   })
        //   .then(response=>{
        //       console.log("Resolve then:--",response)
        //     // resolve(response)
        //   }).catch(error=>{
        //     console.log("Resolve error:--",error)
        //         console.log("Error:-- ",error.message)
        //         // rCb(null,"error");
        //         // resolve(error)
        //     })
          primisesArray.push(axios.get(mainUrl).then(response=>{
            response.data.results.label=label.value
            response.data.results.property=lastSegment
            return response}).catch(error=>{}))
         
        }
          
    })

   

        let req=primisesArray.slice(0, 30)
        // console.log("<---Primise:--->",req.length)
        for (let index = 0; index < 2; index++) {
            
        axios.all(req).then(values=>
            {
                // console.log("values--------->",values[0].data)
                    values.forEach(element => {
                        // console.log("element--------->",element.data)
                        let results=element.data.results;
                        let bindings=results.bindings;
                        // console.log("Resilt : "+lastSegment+"-->>",bindings)
                        if(bindings.length>0)
                        {
                            // console.log("Result :-->>",bindings)
                             let resultBind=bindings[0];
                            // let keys=Object.keys(resultBind)
                            
                             let value=resultBind[results.property].value
                            //  console.log("Last Rsult:--"+ keys[1] +'--->'+value)
                            let data={key:results.label,value}
                            resultObj[results.property]=data
                        }
                        })
                        resultArray.action='dbpedia';
                resultArray.search=resultObj
                // console.log("resultArray--------->",resultArray);
                
                rCb(null,resultArray);
                
            }).catch(error=>{
                console.log("resultArray error--------->",error.message);
            })   
        }
   
    
    // var promise1 = Promise.resolve(3);
    // var promise2 =  new Promise(function(resolve, reject) {
    //  console.log("Promises2")
    //   setTimeout(resolve,1000, 'foo1');
    // });
    // var promise3 = new Promise(function(resolve, reject) {
    //  console.log("Promises3")
    //   setTimeout(resolve,5000,'');
    // });
    // console.log("promise2--------->",primisesArray);
    let array=[promise1,promise2,promise3]
    // Promise.all(primisesArray).then(function(values) {
    //   console.log('values:--->',values);
    
    // //   values.forEach(element => {
    // //       for (var key in element) {

    // //           // console.log("--------->",key);
    // //           // console.log(element[key]);
    // //           resultObj[key]=element[key]
    // //       }
    // //   });

    // //   resultArray=resultObj
    // //   console.log("resultArray--------->",resultArray);
      
    // //   rCb(null,resultArray);
    
    // }).catch(error=>{
    //     console.log("error--------->",error);
    // });

//     var promise1 = Promise.resolve(3);
// var promise2 =  new Promise(function(resolve, reject) {
//  console.log("Promises2")
//   setTimeout(resolve,1000, 'foo1');
// });
// var promise3 = new Promise(function(resolve, reject) {
//  console.log("Promises3")
//   setTimeout(resolve,5000,'');
// });
// console.log("promise2--------->",promise2);
// let array=[promise1,promise2,promise3]
// Promise.all(array).then(function(values) {
//   console.log("Test data:---- ",values);
// });

   
    // dataQuery=dataQuery.concat('?subject onto:abstract ?abstract filter(langMatches(lang(?abstract),"en"))} ')

    // let mainUrl=baseURL + encodeURIComponent( (queryPrefix + dataQuery).replace(/\n+/g,''))+'&output=json';



    // axios.get(mainUrl).then(result=>{
    //         let bindings=result.data.results.bindings;
    //         // console.log("Resilt : -->>",bindings)
    //         let resultAbstact=bindings[0].abstract.value
    //         rCb(null,{text:resultAbstact});
    // }).catch(error=>{
    //     console.log("Error:-- ",error)
    //     rCb(null,"error");
    // })
    
}

function poll(fn){
    return Promise.resolve()
        .then( fn=>{
            console.log("Resolved",fn)
        } )
}


