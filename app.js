const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const bodyParser = require("body-parser");

//db
const db = require("./lib/db");

//import session middleware
const Session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(Session);

const store = new MongoDBStore({
  uri: "mongodb://localhost:27017/Authy",
  collection: "sessions"
});
//routes
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

//set up sessions
app.use(
  Session({
    secret: "Up4biBGidcL&ShrzIoH1cYagNnEa7Whi",
    store: store,
    cookie: {
      httpOnly: true,
      sameSite: true,
      name: "session",
      maxAge: new Date(Date.now() + 3600000 * 24) //expires in 24 hours
    },
    resave: true,
    saveUninitialized: true
  })
);

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
