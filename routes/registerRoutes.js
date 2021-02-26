//Minimum eight characters, at least one letter, one number and one special character
const regularExpression = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("../schemas/UserSchema");

app.set("view engine", "pug");
app.set("views", "views");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (req, res, next) => {
  var payload = {
    pageTitle: "Register your free account",
  };
  res.status(200).render("register", payload);
});

router.post("/", async (req, res, next) => {
  var firstName = req.body.firstName.trim();
  var lastName = req.body.lastName.trim();
  var username = req.body.username.trim();
  var email = req.body.email.trim();
  var password = req.body.password;

  var payload = req.body;

  if (firstName && lastName && username && email && password) {
    var user = await User.findOne({
      $or: [{ username: username }, { email: email }],
    }).catch((error) => {
      console.log(error);
      payload.errorMessage = "Something went wrong. please try again";
      res.status(200).render("register", payload);
    });

    if (!regularExpression.test(password)) {
      payload.errorMessage =
        "Password must be with a minimum of eight characters, at least one [a-z], one [0-9] and one special character";
      res.status(200).render("register", payload);
    } else if (user == null) {
      // No user found

      var data = req.body;
      data.password = await bcrypt.hash(password, 10);

      User.create(data).then((user) => {
        req.session.user = user;
        return res.redirect("/");
      });
    } else {
      // User found
      if (email == user.email) {
        payload.errorMessage = "Email already in use.";
      } else {
        payload.errorMessage = "Username already in use.";
      }
      res.status(200).render("register", payload);
    }
  } else {
    payload.errorMessage = "Make sure each field has a valid value.";
    res.status(200).render("register", payload);
  }
});

module.exports = router;
