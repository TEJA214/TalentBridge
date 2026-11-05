// Load the http module from Node's standard library
const http = require("http");

// The hostname we will run the server on.
// 127.0.0.1 is the localhost
const hostname = "127.0.0.1";
// The port the server will listen on.
const port = 3000;

// Create the server.
// The server requires a function with parameters req, res
// that will run when requests are received from a web browser.
// req - the incoming request from the web browser.
// res - the outgoing response we will send from the browser.
const server = http.createServer(function(req, res) {
    // Respond with OK message.
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");

    // Check the requested URL
    if (req.url == "/roehampton") {
        res.statusCode = 200;
        res.setHeader("Location", "https://www.roehampton.ac.uk/");
        res.end();
    }
    else {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain")
        res.end("Hello, world!" + req.url);
    }

});

// Start the server
server.listen(port, hostname, function() {
    console.log(`Server running at http://${hostname}:${port}/`);
});