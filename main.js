var express = require("express");

var app = express();

app.get("/", function(req, res) {
  res.json({message: "Help, I'm alive."});
});

app.listen(3000);