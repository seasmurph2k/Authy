const mongoose = require("mongoose");

mongoose.connect(
  "mongodb://localhost/Authy",
  { useNewUrlParser: true }
);

const db = mongoose.connection;
//if there's an error log it.
db.on("error", console.error.bind(console, "connection error:"));
//let us know if db connection succeded
db.once("open", function() {
  console.log("connected to db");
});

module.exports = db;
