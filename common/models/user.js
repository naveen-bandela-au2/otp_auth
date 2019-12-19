// Copyright IBM Corp. 2014,2019. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

var config = require("../../server/config.json");
var path = require("path");
var utils = require("loopback/lib/utils");
var bcrypt = require("bcryptjs");
var otp_valid_til = config.app_config.otp_expiry;

//generating otp
generateOTP = () => {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};
//hashing the password
hash = plain => {
  var salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
};

module.exports = User => {
  User.disableRemoteMethodByName("login");

  //hook after login employee for making otp as expired
  // setting the expiry time as it has been generated more than the valid time
  User.afterRemote("emplogin", (context, unused, next) => {
    if (context.result.response.success) {
      User.updateAll(
        { id: context.result.response.token.userId },
        { otp_gen_time: Date.now() - otp_valid_til },
        () => {}
      );
    }
    next();
  });

  //login for employeee
  User.emplogin = (email, password, cb) => {
    User.find({ where: { and: [{ email }, { user_type: 4 }] } }, function(
      err,
      data
    ) {
      if (data.length > 0) var otp_gen_time = Date.now() - data[0].otp_gen_time;
      if (otp_gen_time < otp_valid_til || otp_gen_time == undefined) {
        User.login(
          {
            email,
            password
          },
          "user",
          (err, token) => {
            if (err) {
              if (otp_gen_time == undefined)
                cb(null, { success: 0, error: "email not found" });
              else cb(null, { success: 0, error: "Entered wrong otp" });
              return;
            } else cb(null, { success: 1, token });
          }
        );
      } else {
        cb(null, { success: 0, error: "otp expired" });
      }
    });
  };

  User.remoteMethod("emplogin", {
    accepts: [
      { arg: "email", type: "string" },
      { arg: "password", type: "string" }
    ],
    returns: { arg: "response", type: "any" },
    http: { path: "/emplogin", verb: "post" }
  });
  //employee login completed here
  //klay admin login method
  User.kadmin = (email, password, cb) => {
    User.find(
      { where: { and: [{ email }, { user_type: 1 }] } },
      (err, data) => {
        if (data.length > 0) {
          User.login(
            {
              email,
              password
            },
            "user",
            (err, token) => {
              if (err) {
                cb(null, { success: 0, error: "incorrect password" });
              } else cb(null, { success: 1, token });
            }
          );
        } else {
          cb(null, { success: 0, error: "email not found" });
        }
      }
    );
  };

  User.remoteMethod("kadmin", {
    accepts: [
      { arg: "email", type: "string" },
      { arg: "password", type: "string" }
    ],
    returns: { arg: "response", type: "object" },
    http: { path: "/kadmin", verb: "post" }
  });
  //employeer login
  User.eadmin = (email, password, cb) => {
    User.find({ where: { and: [{ email }, { user_type: 2 }] } }, function(
      err,
      data
    ) {
      if (data.length > 0) {
        User.login(
          {
            email,
            password
          },
          "user",
          (err, token) => {
            if (err) {
              cb(null, { success: 0, error: "incorrect password" });
            } else cb(null, { success: 1, token });
          }
        );
      } else {
        cb(null, { success: 0, error: "email not found" });
      }
    });
  };

  User.remoteMethod("eadmin", {
    accepts: [
      { arg: "email", type: "string" },
      { arg: "password", type: "string" }
    ],
    returns: { arg: "response", type: "any" },
    http: { path: "/eadmin", verb: "post" }
  });
  // generating otp for employee
  User.genotp = (email, cb) => {
    let otp;
    otp = generateOTP();
    console.log(otp);
    User.updateAll(
      { email: email, user_type: 4 },
      { password: hash(otp), otp_gen_time: Date.now() },
      (err, info) => {
        if (info.count != 0) {
          User.app.models.Email.send(
            {
              to: email,
              from: "b.naveen2085@gmail.com",
              subject: "login otp",
              html: `you otp for login is<b> ${otp}</b>`
            },
            err => {
              if (err)
                return console.log("> error sending password reset email");
              console.log("> sending password reset email to:");
            }
          );
          cb(null, { success: 1, status: "otp generated sucessfully" });
          // cb(null, "OTP generated successfully");
        } else {
          cb(null, { success: 0, error: "email not found" });
        }
      }
    );
  };

  User.remoteMethod("genotp", {
    accepts: { arg: "email", type: "string" },
    returns: { arg: "response", type: "any" },
    http: { path: "/genotp", verb: "post" }
  });

  //forgot password for klayadmin a link is sent to mail

  User.admin_forgot_password = (email, cb) => {
    User.find(
      { where: { and: [{ email }, { user_type: { neq: 4 } }] } },
      (err, details) => {
        if (err) console.log(err);
        if (details.length > 0) {
          User.resetPassword(
            {
              email
            },
            function(err) {
              if (err) console.log(err);
              else cb(null, { success: 1, status: "reset mail link sent" });
            }
          );
        } else {
          cb(null, { success: 0, error: "mail not found" });
        }
      }
    );
  };

  User.remoteMethod("admin_forgot_password", {
    accepts: { arg: "email", type: "string" },
    returns: { arg: "response", type: "any" },
    http: { path: "/admin-forgot-password", verb: "get" }
  });

  User.on("resetPasswordRequest", function(info) {
    var url =
      "http://" +
      config.host +
      ":" +
      config.port +
      "/LEFT_THE_METHOD_NAME_FOR_LATER_ADDING";
    var html =
      'Click <a href="' +
      url +
      "?access_token=" +
      info.accessToken.id +
      '">here</a> to reset your password';

    User.app.models.Email.send(
      {
        to: info.email,
        from: "ram@gmail.com",
        subject: "Password reset",
        html: html
      },
      function(err) {
        if (err) return console.log("> error sending password reset email");
        console.log("> sending password reset email to:", info.email);
      }
    );
    console.log(html);
  });

  //role checking methods
  User.kadmin1 = async cb => {
    return { hello: "emp1" };
    //cb(null, "it is klay admin method");
  };

  User.remoteMethod("kadmin1", {
    returns: { arg: "response", type: "any" },
    http: { path: "/kadmin1", verb: "get" }
  });
  User.eadmin1 = cb => {
    cb(null, "it is emp admin method");
  };

  User.remoteMethod("eadmin1", {
    returns: { arg: "response", type: "any" },
    http: { path: "/eadmin1", verb: "get" }
  });
  User.emp1 = async cb => {
    // cb(null, "it is emp method");
    return { hello: "emp1" };
  };

  User.remoteMethod("emp1", {
    returns: { arg: "response", type: "any" },
    http: { path: "/emp1", verb: "get" }
  });
};
