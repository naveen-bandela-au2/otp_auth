// // Copyright IBM Corp. 2014,2017. All Rights Reserved.
// // Node module: loopback-example-user-management
// // This file is licensed under the MIT License.
// // License text available at https://opensource.org/licenses/MIT
// var config = require("../config.json");
// var dsConfig = require("../datasources.json");
// var bcrypt = require("bcryptjs");
// var path = require("path");
// var otp_valid_til=config.app_config.otp_expiry;

// //generating otp
// generateOTP = () => {
//   var digits = "0123456789";
//   let OTP = "";
//   for (let i = 0; i < 6; i++) {
//     OTP += digits[Math.floor(Math.random() * 10)];
//   }
//   return OTP;
// };
// //hashing the password
// hash = plain => {
//   var salt = bcrypt.genSaltSync(10);
//   return bcrypt.hashSync(plain, salt);
// };

// module.exports = function(app) {
//   var User = app.models.user;

//   //login home page
//   app.get("/", async (req, res) => {
//     var credentials = dsConfig.emailDs.transports[0].auth;
//     res.render("login", {
//       email: "naveentechworld@gmail.com",
//       password: ""
//     });
//   });

//   //log a user in
//   app.post("/login1", async (req, res) => {
//     User.find({ where: { email: req.body.email } }, function(err, data) {
//       if (data.length > 0) var time = Date.now() - data[0].date;
//       if (time < config.app_config.otp_expiry || time == undefined) {
//         User.login(
//           {
//             email: req.body.email,
//             password: req.body.password
//           },
//           "user",
//           function(err, token) {
//             if (err) {
//               if (time == undefined) {
//                 res.json({ error: "Email id not exists" });
//               } else {
//                 res.json({ error: "Entered wrong otp" });
//               }
//               return;
//             }
//             User.updateAll(
//               { email: req.body.email },
//               { date: Date.now() - config.app_config.otp_expiry * 2 },
//               async () => {}
//             );
//             res.render("home", {
//               email: req.body.email,
//               accessToken: token.id
//             });
//           }
//         );
//       } else {
//         res.json({ error: "otp expired" });
//       }
//     });
//   });

//   //logout the user with settin a different password
//   app.get("/logout", async (req, res, next) => {
//     if (!req.accessToken) return res.sendStatus(401);
//     User.logout(req.accessToken.id, function(err) {
//       if (err) return next(err);
//       res.redirect("/");
//     });
//   });

// //otp generation only for employee
//  app.post("/request-password-reset1", async (req, res, next) => {
//    let email = req.body.email,
//       otp;
//     otp = generateOTP();
//     console.log(otp)
//     User.updateAll(
//           { email: email, user_type: 4 },
//           { password: hash(otp), otp_gen_time: Date.now() },
//           (err, info) => {
//             if (info.count != 0) {
//               app.models.Email.send(
//                 {
//                   to: email,
//                   from: "b.naveen2085@gmail.com",
//                   subject: "login otp",
//                   html: `you otp for login is<b> ${otp}</b>`
//                 },
//                 err => {
//                   if (err)
//                     return console.log("> error sending password reset email");
//                   console.log("> sending password reset email to:");
//                 }
//               );
//               res.json({ status: "OTP generated successfully"});
//             } else {
//               res.json({ error: "invalid Email id" });
//             }
//           }
//         );
//  });

// ///emp login only
//  app.post("/login", async (req, res) => {
//    let email= req.body.email,password=req.body.password;
//    User.find({ where: { email,user_type:4 } }, function(err, data) {
//       if (data.length > 0) var otp_gen_time = Date.now() - data[0].otp_gen_time;
//       if (otp_gen_time < otp_valid_til || otp_gen_time == undefined) {
//         User.login(
//           {
//             email,
//             password
//           },
//           "user",
//           function(err, token) {
//             if (err) {
//               if (otp_gen_time == undefined)
//                 res.json({ error: "invalid email id" });
//                else
//                 res.json({ error: "Entered wrong otp" });

//               return;
//             }
//             User.updateAll(
//               { email,user_type:4 },
//               { otp_gen_time: Date.now() - otp_valid_til},
//               async () => {}
//             );
//             res.render("home", {
//               email,
//               accessToken: token.id
//             });
//           }
//         );
//       } else {
//         res.json({ error: "otp expired" });
//       }
//     });

//  })

//   //callin the inbuilt user method for password reset
//   app.post("/request-password-reset", async (req, res, next) => {
//     // User.resetPassword(
//     //   {
//     //     email: req.body.email
//     //   },
//     //   function(err) {
//     //     if (err) return res.status(401).send(err);
//     //     res.json({ status: "otp sent sucessfully" });
//     //   }
//     // );

//     let email = req.body.email,
//       otp;
//     otp = generateOTP();
//     console.log(otp, "otp");
//     User.find({ where: { email: email } }, function(err, details) {
//       console.log(details.length);
//       if (details.length == 0) {
//         return res.json({ error: "invalid mail id" }).end();
//       } else if (
//         details[0].user_type != "undefined" &&
//         details[0].user_type != 4
//       ) {
//         return res.json({ status: "Success", user_type: "admin" }).end();
//       } else {
//         console.log("else part");

//         User.updateAll(
//           { email: email, user_type: 4 },
//           { password: hash(otp), date: Date.now() },
//           (err, info) => {
//             if (info.count != 0) {
//               app.models.Email.send(
//                 {
//                   to: email,
//                   from: "b.naveen2085@gmail.com",
//                   subject: "login otp",
//                   html: `you otp for login is<b> ${otp}</b>`
//                 },
//                 err => {
//                   if (err)
//                     return console.log("> error sending password reset email");
//                   console.log("> sending password reset email to:");
//                 }
//               );
//               res.json({ status: "Success", user_type: "user" });
//               res.end();
//             } else {
//               res.json({ error: "something went wrong" });
//             }
//           }
//         );
//       }
//     });
//   });
// };
