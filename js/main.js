var muhProxyAddr = "23.253.238.249";
var muhPortNumber = 2000; //-1;
var muhWebSocket;

// Call up the proxy server and ask for a websocket port to talk to
var getPortNumber = function() {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    var DONE = this.DONE || 4;
    if(xhr.readyState === DONE) {
      muhPortNumber = parseInt(xhr.responseText);
    }
  };
  xhr.open("GET", "http://" + muhProxyAddr + ":3000", true);
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.send(null);
};

// Callback function for when the websocket has a new message
var websocketomcallback = function(evt) {
    console.log(evt.data);
    nextRequest(fixRequest(evt.data));
};

// Create a websocket connected to the proxy
var websockettiem = function() {
    // Message for the user
    $('#statusline').html('Connecting over websocket...');
    // Create web socket
    muhWebSocket = new WebSocket("ws://" + muhProxyAddr + ":" + muhPortNumber);
    // Register callbacks
    muhWebSocket.onopen = function() { $('#statusline').html('Websocket connected!'); };
    muhWebSocket.onmessage = websocketomcallback;
};

// Fix the request
var fixRequest = function(req) {
    // Split the request on \r\n
    var splitReq = req.split("\r\n");
    
    // Parse the first line of the request
    var reqfl = parseRequestFL(splitReq[0]);
    
    // New request to send out
    var fixedreq = "" + reqfl.method + " " + reqfl.url.pathname + " " + reqfl.ver + "\r\n";
    for(var i = 1; i < splitReq.length; ++i) {
        fixedreq = fixedreq + splitReq[i] + "\r\n";
    }
    // Add one last \r\n
    fixedreq = fixedreq + "\r\n";
    
    // return
    return fixedreq;
};


// Parse the first line of an HTTP request
var parseRequestFL = function(req) {
    // Split the first line of the request on whitespace
    var splitReq = req.split(" ");
    
    // Break it up and stick it in an object
    var obj = {
        method: splitReq[0],
        url: parseURL(splitReq[1]),
        ver: splitReq[2].slice(0,8)
    };
    
    // return dat shit
    return obj;
};

// Parse the URL from the first line of an HTTP request
var parseURL = function(url) {
    // Use the DOM to parse the URL
    var l = document.createElement("a");
    l.href = url;
    
    // Create an object to hold the result and break it up
    var obj = {
        host: l.hostname,
        path: l.pathname
    };
    
    // return dat shit
    return obj;
};

// Pulls the web server's address from the input box,
// validates it, and tries to start the proxy
var startProxy = function() {
        var webServerAddress = $('#webservaddr').val();
        if (webServerAddress === "") {
            return;
        } else {
            connectToWebserver(webServerAddress);
            $('#statusline').html('Proxy running...');
            while(true) {
                while(muhRequestQueue.length > 0){
                    sendToWebserver(muhRequestQueue.shift());
                }
                while(muhResponseQueue.length > 0) {
                    muhWebSocket.send(nextResponse());
                }
            }
        }
};


// Configures window elements
var setupWindow = function() {
    // Register event handler for 'Start proxy!' button
    $('#addrbutton').click(startProxy);
    // Adds clickable link to CBT logo
    $('#cbtlink').click(function() {
       window.open("https://crossbrowsertesting.com/"); 
    });
    // Initializes status line
    $('#statusline').html('Initializing proxy tunnel...');
};

// Function to call when app loads
window.onload = function() {
    // Setup the view
    setupWindow();
    // Ask the proxy for a port to connect a websocket to
    //getPortNumber();
    // Create a websocket and connect to the proxy with it
    websockettiem();
};
