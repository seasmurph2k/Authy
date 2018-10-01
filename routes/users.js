const express = require("express");
const router = express.Router();
const User = require("../models/User");
const validateUserInput = require("../validation/register");
const passport = require("passport");

/*
  POST: /users/regsiter
  Desc: Register new user
  Public:True
*/
router.post(
  "/register",
  //validation
  (req, res, next) => {
    const { errors, isValid } = validateUserInput(req.body);
    if (!isValid) {
      console.log(errors);
      res.locals.errors = errors;
      //  return res.status(400).json(errors);
      res.render("register", {
        isAuthed: req.isAuthenticated()
      });
    } else {
      next();
    }
  },
  async (req, res, next) => {
    try {
      let username = req.body.username;
      let email = req.body.email;
      let password = req.body.password;

      let newUser = new User({
        username,
        email
      });

      await newUser.setPassword(password);
      await newUser.save();

      res.redirect("/login");
    } catch (error) {
      //add middleware utils to check for existence beforehand.
      if (error.code === 11000) {
        let errmsg = error.errmsg;
        let errors = {};
        //NTS does not notify if both already exist
        errmsg.includes("username")
          ? (errors.username = "Username already exists")
          : (errors.email = "Email address already in use");
        res.locals.errors = errors;
        return res.status(400).render("register", {
          isAuthed: req.isAuthenticated()
        });
      }
      next(error);
    }
  }
);

/*
  POST: /users/login
  Desc:Login user
  Public:True
*/
router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureMessage: "Incorrect username or password"
  }),
  (req, res) => {
    //if there's a message object attatched to session delete it
    if (req.session.messages) {
      delete req.session["messages"];
    }
    res.redirect("/dashboard");
  }
);

module.exports = router;
