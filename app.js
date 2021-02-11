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
const cors = require("cors");

app.set("port", port);
app.use(express.static("public"));
app.use(cors());

app.get("/api/ranking", (req, res) => {
  console.log(req);
  res.set({ "access-control-allow-origin": "*" });
  res.status(200).json({ response: "ok" });
});

https.createServer(options, app).listen(port);

module.exports = app;
