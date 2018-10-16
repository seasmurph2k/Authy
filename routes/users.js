const express = require("express");
const router = express.Router();
const User = require("../models/User");
const validateUserInput = require("../validation/register");
const passport = require("passport");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const config = require("../config/config");
//validation
const validateChangePassword = require("../validation/changepassword");
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
  }, //sanitizeation
  //The following could be extracted in a couple ways
  (req, res, next) => {
    //check if username exist
    User.findOne({ username: req.body.username })
      .then(user => {
        if (!user) {
          next();
        } else {
          let errors = { username: "Username already exists" };
          res.locals.errors = errors;
          return res.status(400).render("register", {
            isAuthed: req.isAuthenticated()
          });
        }
      })
      .catch(err => {});
  },
  (req, res, next) => {
    //check if email exists
    User.findOne({ email: req.body.email })
      .then(user => {
        if (!user) {
          next();
        } else {
          let errors = { email: "Email already exists" };
          res.locals.errors = errors;
          return res.status(400).render("register", {
            isAuthed: req.isAuthenticated()
          });
        }
      })
      .catch(err => {});
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
      //should never happen now
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

router.get("/forgot", (req, res, next) => {
  res.render("forgot");
});
/*
  POST users/reset/
  Desc:Request a reset token
  Public:True
*/
//todo abstract this
router.post("/reset", (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        res
          .status(400)
          .json({ message: "That email doesn't belong to an account" });
      } else {
        //generate token
        const token = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000;
        //save in db
        user
          .save()
          .then(result => {
            //updated user saved in db

            //send mail via nodemailer
            let transport = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: config.email.auth.user,
                pass: config.email.auth.pass
              }
            });
            let mailOptions = {
              from: config.email.defaultFromAddress,
              to: user.email,
              subject: "Test reset",
              html:
                '<p>Click <a href="/reset/' +
                token +
                '">here</a> to reset password</p>'
            };
            transport.sendMail(mailOptions, function(err, info) {
              if (err) console.log(err);
              else {
                res.send(200);
                console.log(`Mail sent: ${info}`);
              }
            });
          })
          .catch(err => {
            console.log(err);
          });
      }
    })
    .catch(err => {
      console.log(err);
    });
});

/*
  GET:/users/reset/:token
  Desc: Display password form for updating users password
  Public:False
*/

router.get("/reset/:token", (req, res, next) => {
  User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        //invalid token
        res.redirect("/");
      }
      res.render("reset");
    })
    .catch(err => {
      console.log(err);
    });
});

/*
  POST:/users/reset/:token
  Desc: Resets a users password
  Public:False
*/

router.post(
  "/reset/:token",
  (req, res, next) => {
    //ensure passwords match
    if (req.body.password !== req.body.password2) {
      //prettify this
      return res.status(400).json({ password: "passwords don't match" });
    }
    next();
  },
  async (req, res, next) => {
    try {
      let password = req.body.password;
      let usertoUpdate = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
      }).exec();
      //invalid token
      if (!usertoUpdate) {
        return res.send("No user found");
      }

      usertoUpdate.resetPasswordExpires = undefined;
      usertoUpdate.resetPasswordToken = undefined;

      await usertoUpdate.setPassword(password);
      await usertoUpdate.save();

      res.redirect("/login");
    } catch (err) {
      res.sendStatus(500).json({ err });
      console.log(err);
    }
  }
);

router.post(
  "/changepassword",
  isAuthenticated,
  (req, res, next) => {
    const { errors, isValid } = validateChangePassword(req.body);
    if (!isValid) {
      console.log(errors);
      /* res.json({ errors }); */
      res.locals.errors = errors;
      res.status(400).redirect("/profile");
    } else {
      next();
    }
  },
  async (req, res, next) => {
    try {
      let oldPassword = req.body.oldPassword;
      let newPassword = req.body.newPassword;

      let user = await User.findOne({
        email: req.session.passport.user
      }).exec();
      //check for user
      //change password
      await user.changePassword(oldPassword, newPassword);
      req.logout();
      res.status(200).redirect("/login");
    } catch (error) {
      if (error.name === "IncorrectPasswordError") {
        res.locals.errors.password = "Incorrect password";
        res.status(400).redirect("/profile");
      }
      console.log(error);
      next(error);
    }
  }
);

function isAuthenticated(req, res, next) {
  req.isAuthenticated() ? next() : res.redirect("/login");
}
module.exports = router;
