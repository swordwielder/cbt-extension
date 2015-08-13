// ------ Global variables ------
var muhSocketId = null;
var muhRequestQueue = [];
var muhResponseQueue = [];

// ------ Utility functions for dealing with plain TCP sockets ------
function str2ab(str) {
    var encoder = new TextEncoder('utf-8');
    return encoder.encode(str).buffer;
}

function ab2str(ab) {
    var dataView = new DataView(ab);
    var decoder = new TextDecoder('utf-8');
    return decoder.decode(dataView);
}

// ------ Primary functions of this portion ------

// Callback function to store socket id to global variable
var storeSocketId = function(createInfo) {
    muhSocketId = createInfo.socketId;
};

// Create TCP socket in a forcibly synchronous manner
var createTCPSocket = function() {
  chrome.sockets.tcp.create({}, storeSocketId);
  chrome.sockets.tcp.onReceive.addListener(
    function(info) {
            if(info.data)
                muhResponseQueue.push(ab2str(info.data));
    }
  );
};

// Connect to a webserver
var connectToWebserver = function(servAddr) {
    if (muhSocketId === null) {
        createTCPSocket();
        setTimeout(function() {
            connectToWebserver(servAddr);
        }, 1000);
    } else {
        chrome.sockets.tcp.connect(muhSocketId, servAddr, 80, function (result) {
                if(chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                } else {
                    console.log(result);
                }
        });
    }
};

// Send data to the webserver
var sendToWebserver = function(datastr) {
  var dataToSend = str2ab(datastr);  
  chrome.sockets.tcp.send(muhSocketId, dataToSend, function (sendInfo) { console.log(sendInfo); });
};

// Get the next response available from the queue
var nextResponse = function() {
    if (muhResponseQueue.length > 0) {
        var x = muhResponseQueue.shift();
        return x;
    } else {
        return null;
    }
};

// Queue the next request line for the web server
var nextRequest = function(req) {
    muhRequestQueue.push(req);
};
