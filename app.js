const express = require("express");
const https = require("https");
const fs = require("fs");
const http = require("http");
const options = {
  key: fs.readFileSync("./private.key"),
  cert: fs.readFileSync("./certificate.crt"),
};
const app = express();

const port = 3000;
const host = "0.0.0.0";

app.set("port", port);
app.use(express.static("public"));

https.createServer(options, app).listen(port);

module.exports = app;
