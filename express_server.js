// Import express.js
const express = require("express");

// Create express app
var app = express();

// Create a get for root - /
app.get("/", function(req, res) {
    res.send("Hello world!");
});
app.get("/goodbye", function(req, res) {
    res.send("Goodbye, world!");
});
app.get("/student/:id/:name", function(req, res) {
    console.log(req.params);

    res.send("Student ID: " + req.params.id +
             " <br> Student Name: " + req.params.name);
});

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});