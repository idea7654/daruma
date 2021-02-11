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
const io = require("socket.io")(443);

app.set("port", port);
app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");
});

app.get("/api/ranking", (req, res) => {
  console.log(req);
  res.status(200).json({ response: "ok" });
});

https.createServer(options, app).listen(port);

module.exports = app;
