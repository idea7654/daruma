const express = require("express");
const app = express();

const port = 3000;
const host = "0.0.0.0";

app.set("port", port);
app.use(express.static("public"));

app.listen(port, host);

module.exports = app;
