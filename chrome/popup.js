document.addEventListener('DOMContentLoaded', function (){

    document.getElementById("word").addEventListener('blur', (event) => {
      checkWord(event.target)    
    });

    document.getElementById("save").addEventListener('click', (event) => {
        saveWord(event.target)
    })

    document.getElementById("clear").addEventListener('click', (event) => {
        resetForm()
    })

    getRandomWord()
    // var queryInfo = {
    //     active: true,
    //     currentWindow: true
    // };
    // console.log('popup content loaded');
    
    // chrome.tabs.query(queryInfo, function (tabs) {
    //     var tab = tabs[0];
    //     var showurl = tab.url;
    //     var atag = document.getElementById('refbid'); //or grab it by tagname etc
    //     atag.href = "http://myaccount.reveantivirus.com/sub-user/addURL.htm?t=2&url=" + showurl;
    //     atag = document.getElementById('refwid');
    //     atag.href = "http://myaccount.reveantivirus.com/sub-user/addURL.htm?t=1&url=" + showurl;
        
    //     console.log("cheking for page details");
    //     var mess = {
    //         from: "popup",
    //         to : "page"
    //     };
    //     chrome.tabs.sendMessage(tabs[0].id, mess, processResponse);
    // });


});


//utils
function validateData(){
    var eles = document.getElementsByClassName("required");
    for(var i=0; i < eles.length; i++){
        var d = eles[i].value
        if(d == null || d.length == 0)
            return false
    }
    return true
}

function resetForm(){
    var eles = document.getElementsByClassName("data");
    for(var i=0; i < eles.length; i++){
        eles[i].value = ""
    }
}

function getJSONData(){
    var eles = document.getElementsByClassName("data");
    var payload = {}
    for(var i=0; i < eles.length; i++){
        payload[eles[i].id] = eles[i].value
    }
    return payload
}

function showMessage(msg){
    document.getElementById("info").innerHTML = msg;
}


var backgroundChannel = chrome.runtime.connect({name: "popup-background"});
backgroundChannel.onMessage.addListener(responseHandler)

function getRandomWord(){
    var request = {
        from : "popup",
        to : "background",
        messageType : "getRandomWord",
        payload : {
        }
    }
    backgroundChannel.postMessage(request); 
}

function checkWord(ele){
    var request = {
        from : "popup",
        to : "background",
        messageType : "checkWord",
        payload : {
            word : ele.value
        }
    }
    backgroundChannel.postMessage(request);    
}

function saveWord(ele){
    showMessage("")
    var isValid = validateData()
    if(!isValid){
        showMessage("Invalid Input to save")
    }
    var request = {
        from : "popup",
        to : "background",
        messageType : "saveWord",
        payload : getJSONData()
    }
    backgroundChannel.postMessage(request);
}



function responseHandler(response)
{
    console.log("word description received", response);
    if(response == null || response.from !== "background" || response.to !== "popup"){
        return;
    }
    responseHandlers[response.messageType](response);
}

var responseHandlers = {
    "saveWord" : function(data){
        if(data.status != 0){
            return
        }
        showMessage("Saved Successfully")
        resetForm()
    },
    "checkWord" : function(data){
        if(data.status != 0){
            return
        }
        document.getElementById("description").value = data.payload.description
        document.getElementById("example").value = data.payload.example
        document.getElementById("tags").value = data.payload.tags
        document.getElementById("synonames").value = data.payload.synonames
    },
    "getRandomWord" : function(data){
        if(data.status != 0){
            return
        }
        responseHandlers.checkWord(data);
        document.getElementById("word").value = data.payload.word
    }
}


function processResponse(data){
    

    // var queryInfo = {
    //     active: true,
    //     currentWindow: true
    // };
    // chrome.tabs.query(queryInfo, function (tabs) {
    //     var tmpContainer = document.getElementById("tmp-container");
    //     var container = document.getElementById("container");
    //     console.log(tabs[0].id+" ; "+tabs[0].url+"***");
        
    //     if(data.tabId != tabs[0].id){
    //         tmpContainer.style.display = "block";
    //         container.style.display = "none";
    //         return;
    //     }else{
    //         tmpContainer.style.display = "none";
    //         container.style.display = "block";
    //     }
        
    //     if(data.status !== "0"){
    //         document.getElementById("response").innerHTML = data.response;
    //         return;
    //     }
        
    //     var message = "";
    //     if (data.isBlock === "1")
    //         message = "<label style='color: red'>"+getdomain(data.url)+" is blocked.</label>";
    //     else{
    //         message = '<label class="safe">' + getdomain(data.url) + 'is safe.</label>';
    //         message += '<br><lable> Website belongs to following category </label><ol id="injection">';
    //         message += data.response;
    //         message += "</ol>";
    //     }
    //     document.getElementById("response").innerHTML = message;
    // });
}

chrome.runtime.onMessage.addListener(responseHandler);