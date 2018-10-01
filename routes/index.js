const express = require("express");
const router = express.Router();
const passport = require("passport");

/* GET Index page */
router.get("/", function(req, res) {
  res.render("index", {
    isAuthed: req.isAuthenticated()
  });
});

/* GET Login page. */
router.get("/login", isAuthedMiddleware, function(req, res, next) {
  res.render("login", {
    isAuthed: req.isAuthenticated(),
    messages: req.session.messages || null
  });
});

/* GET Register page. */
router.get("/register", isAuthedMiddleware, function(req, res, next) {
  res.render("register", {
    isAuthed: req.isAuthenticated(),
    errors: {}
  });
});

/* GET dashboard page. */
router.get(
  "/dashboard",
  (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.redirect("/login");
    }
  },
  function(req, res, next) {
    res.render("dashboard");
  }
);

/* Logout */
router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

//if authenticated redirect to dashboard else proceed
function isAuthedMiddleware(req, res, next) {
  req.isAuthenticated() ? res.redirect("/dashboard") : next();
}

module.exports = router;
