const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const app = express();

const PORT = 3000;

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.listen(PORT, () => {
  `Server running on http://localhost:${PORT}`;
});
