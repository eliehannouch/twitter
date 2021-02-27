const express = require("express");
const app = express();
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../schemas/UserSchema");
const nodemailer = require("nodemailer");
const uuid = require("uuid-random");

app.use(bodyParser.urlencoded({ extended: false }));

router.get("/", (req, res, next) => {
  res.status(200).render("requestReset");
});
router.post("/", async (req, res, next) => {
  if (!req.body) return;

  const payload = req.body;
  const findEmail = req.body.resetEmail.trim();
  console.log(findEmail);
  const getUser = await User.findOne({ email: findEmail }).catch(() => {
    payload.statusMessage = "Something went wrong. Please try again.";
    return res.status(400).render("requestReset", payload);
  });

  if (getUser == null) {
    payload.statusMessage =
      "No user found. Please use the email address used when registering your account";
    return res.status(400).render("requestReset", payload);
  } else {
    const checkForField = await User.updateOne({ email: findEmail }, [
      {
        $set: {
          resetPassword: {
            $cond: [{ $not: ["$resetPassword"] }, "", "$resetPassword"],
          },
        },
      },
    ]).catch(() => {
      payload.statusMessage = "Something went wrong. Please try again.";
      return res.status(400).render("requestReset", payload);
    });

    const checkForPreviousReset = await User.findOne({ email: findEmail })
      .select("resetPassword")
      .catch(() => {
        payload.statusMessage = "Something went wrong. Please try again.";
        return res.status(400).render("requestReset", payload);
      });

    if (checkForPreviousReset.resetPassword !== "") {
      payload.statusMessage =
        "You have already requested a password change. Please check your inbox";
      return res.status(400).render("requestReset", payload);
    }

    const uniqueId = uuid();

    const updateUser = await User.findOneAndUpdate(
      { email: findEmail },
      { resetPassword: uniqueId }
    ).catch(() => {
      payload.statusMessage = "Something went wrong. Please try again.";
      return res.status(400).render("requestReset", payload);
    });

    var transporter = nodemailer.createTransport({
      host: process.env.host,
      port: 25,
      auth: {
        user: process.env.user,
        pass: process.env.pass,
      },
    });

    var mailOptions = {
      from: "Twitter Clone",
      to: findEmail,
      subject: "Password change",
      html: `<h4 style=' text-align: left;'>Password Reset Request </h4>
            <p  style=' text-align: left;'> Hi Dear,  We're sending you this email because you requested a password reset. Click on this link to create a new password</p>
            <a href="http://localhost:3003/passwordReset?id=${uniqueId}" style=' text-align: left; text-decoration: none; color: #1FA2F1';'>Click here</a>
            <p style='text-align: left;'> If you didn't request a password reset, please ignore this email. Your password will not be Changed </p>
            <p style='text-align: left;'> Twita Team </p>
            `,
    };

    transporter.sendMail(mailOptions, async function (error, info) {
      if (error) {
        const updateUser = await User.findOneAndUpdate(
          { email: findEmail },
          { resetPassword: "" }
        ).catch(() => {
          payload.statusMessage = "Something went wrong. Please try again.";
          return res.status(400).render("requestReset", payload);
        });
        payload.statusMessage = "Something went wrong. Please try again";
        return res.status(400).render("requestReset", payload);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    payload.statusMessage = `We have sent you an email with a link to reset your password. If you don't see it in your inbox, please check your spam folder. Notice in order to send a new request you must complete the old one.`;
    return res.status(200).render("requestReset", payload);
  }
});

module.exports = router;
