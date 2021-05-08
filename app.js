const express = require("express");
const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync("./private.key"),
  cert: fs.readFileSync("./certificate.crt"),
};
const app = express();
const port = 3000;
const http = require("http");
const cors = require("cors");
let rank = [{ nick: "이데아", time: "2.37" }];

app.set("port", port);
// app.use(function (req, res, next) {
//   console.log("작동중");
//   if (req.secure) {
//     // request was via https, so do no special handling
//     next();
//   } else {
//     // request was via http, so redirect to https
//     res.redirect("https://" + req.headers.host + req.url);
//   }
// });
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

app.get("/api/ranking", (req, res) => {
  res.set({ "access-control-allow-origin": "*" });
  rank.sort((a, b) => {
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  });
  if (rank.length > 10) {
    rank.splice(10, rank.length - 10);
  }
  res.status(200).send(rank);
});

app.post("/api/ranking", (req, res) => {
  console.log(req.body);
  const { nick, time } = req.body;
  rank.push({ nick: nick, time: time });
  res.status(200).send("성공");
});
http.createServer(app).listen(3000);
//https.createServer(options, app).listen(port);

module.exports = app;
