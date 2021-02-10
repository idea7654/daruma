const express = require("express");
const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync("./private.key"),
  cert: fs.readFileSync("./certificate.crt"),
};
const app = express();

const port = 443;
const host = "0.0.0.0";

app.set("port", port);
app.use(express.static("public"));

options ? https.createServer(options, app).listen(port) : undefined;

options
  ? http
      .createServer(function (req, res) {
        res.writeHead(301, {
          Location: "https://" + req.headers["host"] + req.url,
        });
        res.end();
      })
      .listen(80)
  : http.createServer(app).listen(PORT, () => {
      console.log(`Server is running at port ${PORT}`);
    });

module.exports = app;
