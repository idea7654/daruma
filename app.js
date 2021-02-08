const express = require("express");
const app = express();

const port = 3000;

app.set("port", port);
app.use(express.static("public"));

app.listen(port);

module.exports = app;
