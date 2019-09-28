console.log("Background page started");

console.log("Synching from cloud storage");

function forceSyncFromCloud(){
	chrome.storage.local.clear(function(){
		console.log("Local storage cleared");
		chrome.storage.local.set({"word_count":0}, function(){
			chrome.storage.sync.get(null, function(data){
				onStorageUpdate(data, "sync-local")
			})
		})
	})
}

function onStorageUpdate(data, namespace){
	console.log("onStorageUpdate called", data, namespace);

	if(data == null || data.length == 0 || !namespace.startsWith("sync"))
		return

	var isSyncLocal = (namespace == "sync-local")

	var keysToGet = ["word_count"];
	if(!isSyncLocal){
		for(var key in data){
			keysToGet.push(key)
		}
	}

	chrome.storage.local.get( keysToGet, function(results){

		var localData = {
			"word_count" : results.word_count
		}

		for(var key in data){

			var isUpdate = data[key].oldValue != null
			var value = (isSyncLocal)?data[key]:data[key].newValue
			
			if(key.startsWith("words")){
				var index = -1;
				if(!isUpdate)
				{
					localData.word_count = localData.word_count + 1;
					index = localData.word_count
				}else{
					index = results[key].index
				}
				value.index = index;
				localData[key] = value
				localData["words"+"."+index] = value
			}else{
				localData[key] = value
			}
		}
		chrome.storage.local.set(localData, function(){
			console.log("Saved to local successfully")
		})
	})
}

forceSyncFromCloud()

chrome.storage.onChanged.addListener(onStorageUpdate)





function processMessage(request, sender, sendResponse)
{
    console.log("req received in background");
    //only process request to server
    if(request.to !== "background"){
        return;
    }

    if(request.from == "popup"){
    	processPopupRequest(request, sender, sendResponse)
    }

    // var response = validatePage(request);
    // response.tabId = sender.tab.id;
    // if(request.index != null){
    //     response.index = request.index;
    //     response.searchId = request.searchId;
    // }
    // console.log(response);
    // sendResponse(response);
    console.log("req processed");
}



function processPopupRequest(request, sendResponse){
	console.log(request)
	requestProcessors[request.messageType]( request.payload, function(payload){
		var status = (payload != null)?0:1;
		sendResponse({
			from : "background",
			to : request.from,
			messageType : request.messageType,
			status : status,
			payload : payload
		});
	})
}

function getKey(word){
	return "words."+word;
}

var requestProcessors = {
	"checkWord" : function(payload, callback){
		if(payload.word == "test"){
			callback( {
				word : "test",
				description : "test",
				example : "example",
				tags : "tags",
				synonames : "synonames"
			})
		}else{
			var key = getKey(payload.word)
			chrome.storage.local.get([key], function(results){
				callback(results[key])
			})
		}
	},
	"saveWord" : function(payload, callback){
		var key = getKey(payload.word)

		var data = {}
		data[key] = payload;

		console.log(data);

		chrome.storage.sync.set(data, function() {
			if(chrome.runtime.lastError){
				console.log(chrome.runtime.lastError);
			}
          	console.log("Saved successfully: "+data);
          	callback("OK")
        });
	},
	"getRandomWord" : function(payload, callback){
		chrome.storage.local.get(["word_count"], function(results){
			if(results.word_count > 0){
				var key = getKey(getRandom(results.word_count));
				console.log("getting "+key);

				chrome.storage.local.get([key], function(word){
					console.log("got ", word)
					callback(word[key])
				})
			}else{
				callback(null)
			}
		})
	}
}



function getRandom(max){
	return 1 + Math.floor( Math.random() * max )
}


chrome.runtime.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg){
		processMessage(msg, function(response){
			port.postMessage(response)
		})
	})
})

// chrome.runtime.onMessage.addListener(processMessage);
console.log("Background Page Ended");