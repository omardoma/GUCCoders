var mongoose = require("mongoose");
var Student = mongoose.model("Student");
var bcrypt = require('bcryptjs');
var path = require('path');
var nodemailer = require('nodemailer');
var nev = require('email-verification')(mongoose);
var randtoken = require('rand-token');
var TempStudent = null;

var myHasher = function (password, tempUserData, insertTempUser, callback) {
    bcrypt.genSalt(8, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            return insertTempUser(hash, tempUserData, callback);
        });
    });
};

nev.configure({
    persistentUserModel: Student,
    verificationURL: 'http://guccoders.com/api/verifyAccount/${URL}',
    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'se.mailer2017@gmail.com',
            pass: 'Omar2121996!'
        }
    },
    verifyMailOptions: {
        from: 'GUC-Coders Registration System <se.mailer2017@gmail.com>',
        subject: 'Verify Your Account',
        // html: '<div style="background-color:#fff;margin:0 auto 0 auto;padding:30px 0 30px 0;color:#4f565d;font-size:13px;line-height:20px;font-family:\'Helvetica Neue\',Arial,sans-serif;text-align:left;\"><center><![if !mso]><table style="width:550px;text-align:center"><tbody><tr><td style="padding:0 0 20px 0;border-bottom:1px solid #e9edee;"><img src="http://careerun.com/wp-content/uploads/2016/11/GUC-logo.png" width="300" height="150" style="border: 0px;"></a></td></tr><tr><td colspan="2" style="padding:30px 0;"><p style="color:#1d2227;line-height:28px;font-size:22px;margin:12px 10px 20px 10px;font-weight:400;">Hi, it\'s great to meet you.</p><p style="margin:0 10px 10px 10px;padding:0;">We\'d like to make sure we got your email address right.</p><p><a style="display:inline-block;text-decoration:none;padding:15px 20px;background-color:#18bc9c;border:1px solid #18bc9c;border-radius:3px;color:#FFF;font-weight:bold;" href="${URL}" target="_blank">Yes, it\'s me – let\'s get started</a></p></td></tr><tr><td colspan="2" style="padding:30px 0 0 0;border-top:1px solid #e9edee;color:#9b9fa5"></td></tr></tbody></table>    <![endif]></center></div>',
        html: '<p>Please verify your account by clicking <a href="${URL}">this link</a>. If you are unable to do so, copy and ' +
            'paste the following link into your browser:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'

    },
    confirmMailOptions: {
        from: 'GUC-Coders Registration System <se.mailer2017@gmail.com>',
        subject: 'Account Verified',
        html: '<p>Your account has been successfully verified.</p>',
        text: 'Your account has been successfully verified'
    },
    hashingFunction: myHasher
}, function (error, options) {});

nev.generateTempUserModel(Student, function (err, tempUserModel) {
    TempStudent = tempUserModel;
});

var sendEmail = function (email, text, subject, callback) {
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'se.mailer2017@gmail.com',
            pass: 'Omar2121996!'
        }
    });
    var mailOptions = {
        from: 'GUC-Coders Registration System <se.mailer2017@gmail.com>',
        to: email,
        subject: subject,
        html: text
    };
    transporter.sendMail(mailOptions, function (err) {
        if (err)
            callback(false);
        else
            callback(true);
    });
};

module.exports.resendVerification = function (req, res) {
    if (!req.session.username) {
        var email = req.body.email;
        var idx = email.lastIndexOf('@');
        if (email) {
            var emailRegex = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
            if (emailRegex.test(email)) {
                if (idx > -1 && email.slice(idx + 1) !== 'student.guc.edu.eg') {
                    return res.status(400).render("resendVerification", {
                        error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                        email
                    });
                }
            } else {
                return res.status(400).render("resendVerification", {
                    error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                    email
                });
            }
            nev.resendVerificationEmail(email, function (err, userFound) {
                if (err) {
                    res.status(400).render('resendVerification', {
                        error: "Could not send the email, please try again!",
                        email
                    });
                } else {
                    if (userFound) {
                        res.status(200).render('resendVerification', {
                            success: "An Email was sent successfully to " + email + ", check your inbox.",
                            email: ""
                        });
                    } else {
                        res.status(400).render('resendVerification', {
                            error: "The email you provided was not used for registration to the website or the account which is associated to it, has already been verified.",
                            email
                        });
                    }
                }
            });
        } else {
            res.status(400).render("resendVerification", {
                error: "You need to enter a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                email
            });
        }
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.renderCreatePortfolio = function (req, res) {
    if (req.session.username) {
        res.status(200).render("createPortfolio", {
            username: "true",
            name: "",
            description: ""
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.renderRegister = function (req, res) {
    if (!req.session.username) {
        var input = {
            username: "",
            email: "",
            gucID: ""
        };
        res.status(200).render("register", {
            input
        });
    } else {
        res.status(401).redirect('/api/editPortfolio/1');
    }
};

module.exports.renderLogin = function (req, res) {
    if (!req.session.username) {
        res.status(200).render('login', {
            usererror: ""
        });
    } else {
        res.status(401).redirect('/api/editPortfolio/1');
    }
};

module.exports.login = function (req, res) {
    var username = req.body.username;
    username = username.toLowerCase();
    var password = req.body.password;
    var email = req.body.email;

    Student.findOne({
        username: username
    }, (function (err, user) {
        if (err) {
            res.render('login', {
                error: "Unknown Error occured!",
                usererror: username
            });
        } else {
            if (!user) {
                res.status(400).render('login', {
                    error: "Username not found, please note that if you haven't verified your account yet, you won't be able to log in.",
                    usererror: ""
                });

            } else {
                if (bcrypt.compareSync(password, user.password)) {
                    req.session.username = username;
                    req.session.firstTime = true;
                    res.status(200).redirect('/api/editPortfolio/1');
                } else {
                    res.status(401).render('login', {
                        error: "Password is incorrect!",
                        usererror: username
                    });
                }
            }
        }
    }));
};

var checkRegistration = function (req, res, callback) {
    var gucID = req.body.gucID;
    Student.findOne({
        gucID: gucID
    }, function (err, user) {
        if (!user) {
            checkRegistrationInTemp(req, res, function (exist, id, un) {
                callback(exist, id, un);
            });
        } else {
            if (user.username === req.body.username) {
                callback(true, true, true);
            } else {
                callback(true, true, false);
            }
        }
    });
};

var checkRegistrationInTemp = function (req, res, callback) {
    var gucID = req.body.gucID;
    TempStudent.findOne({
        gucID: gucID
    }, function (err, user) {
        if (!user) {
            callback(false, false, false);
        } else {
            if (user.username === req.body.username) {
                callback(true, true, true);
            } else {
                callback(true, true, false);
            }
        }
    });
};

module.exports.register = function (req, res) {
    if (!req.session.username) {
        var username = req.body.username;
        username = username.toLowerCase();
        var password = req.body.password;
        var confirmPassword = req.body.confirm_password;
        var email = req.body.email;
        var gucID = req.body.gucID;
        var idx = email.lastIndexOf('@');
        var input = {
            username: username,
            email: email,
            gucID: gucID
        };
        var usernameRegex = new RegExp("^[a-zA-Z0-9]+\\s*$");
        if (!usernameRegex.test(username)) {
            input.username = "";
            return res.status(400).render("register", {
                error: "Username cannot contain white spaces at the beginning or the middle.",
                input
            });
        }
        var passwordRegex = new RegExp("(?=^.{8,}$)((?=.*\\d)(?=.*\\W+))(?![.\\n])(?=.*[a-z]).*$");
        if (!passwordRegex.test(password)) {
            return res.status(400).render("register", {
                error: "Password must contain at least 8 characters, including a digit and a special character.",
                input
            });
        } else if (password !== confirmPassword) {
            return res.status(400).render("register", {
                error: "Passwords do not match.",
                input
            });
        }
        var emailRegex = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
        if (emailRegex.test(email)) {
            if (idx > -1 && email.slice(idx + 1) !== 'student.guc.edu.eg') {
                input.email = "";
                return res.status(400).render("register", {
                    error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                    input
                });
            }
        } else {
            input.email = "";
            return res.status(400).render("register", {
                error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                input
            });
        }
        var idRegex = new RegExp("\\d{2}[\\-]\\d{3,5}");
        if (!idRegex.test(gucID)) {
            input.gucID = "";
            return res.status(400).render("register", {
                error: "You need to have a valid GUC ID, A valid GUC ID is in the form of \"XX-(3-5) Digits\"",
                input
            });
        }
        checkRegistration(req, res, function (exist, id, un) {
            if (exist === false) {
                var newUser = Student({
                    username: username,
                    password: password,
                    email: email,
                    gucID: gucID,
                    projectsLength: 0
                });
                nev.createTempUser(newUser, function (err, existingPersistentUser, newTempUser) {
                    if (err) {
                        console.log(err);
                        return res.status(400).render("register", {
                            error: "An unknown error occured, please try again.",
                            input
                        });
                    }
                    if (existingPersistentUser) {
                        input.email = "";
                        return res.status(400).render("register", {
                            error: "GUC Email is associated with an already existing account.",
                            input
                        });
                    }
                    if (newTempUser) {
                        var URL = newTempUser[nev.options.URLFieldName];
                        nev.sendVerificationEmail(email, URL, function (err, info) {
                            if (err) {
                                res.status(400).render("resendVerification", {
                                    error: "Could not send the verification email, Try sending it again",
                                    email: input.email
                                });
                            } else {
                                input = {
                                    username: "",
                                    email: "",
                                    gucID: ""
                                };
                                res.status(200).render("register", {
                                    success: "A verification email has been sent, You must verify your account before you can login.",
                                    input
                                });
                            }
                        });
                    } else {
                        res.status(400).render("register", {
                            error: "User has already registered, please check your email to verify your account!",
                            input
                        });
                    }
                });
            } else {
                if (un === false) {
                    input.gucID = "";
                    res.status(400).render("register", {
                        error: "GUC ID is associated with an existing account!",
                        input
                    });
                } else {
                    input.username = "";
                    res.status(400).render("register", {
                        error: "Username already exists!",
                        input
                    });
                }
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.logOut = function (req, res) {
    if (req.session)
        req.session.destroy(function () {
            res.status(200).redirect('/');
        });
    else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.renderUnverified = function (req, res) {
    if (!req.session.username) {
        var url = req.params.url;
        nev.confirmTempUser(url, function (err, user) {
            if (err) {
                return res.status(400).render("resendVerification", {
                    error: "An error occured, try resending the verification mail.",
                    email: ""
                });
            }
            // handle error...

            if (user) {
                nev.sendConfirmationEmail(user['email_field_name'], function (err, info) {
                    res.status(200).render('login', {
                        success: "Account has been verified successfully.",
                        usererror: ""
                    });
                });
            } else {
                res.status(400).render('register', {
                    error: "The verification code is either incorrect or has expired, please register again.",
                    input: {
                        username: "",
                        email: "",
                        gucID: ""
                    }
                });
            }
        });
    } else {
        res.status(401).render("login", {
            error: "You are already logged in to an account, you need to be logged out to perform  this action.",
            usererror: ""
        });
    }
};

module.exports.renderResendVerification = function (req, res) {
    if (!req.session.username) {
        res.status(200).render('resendVerification', {
            email: ""
        });
    } else {
        res.status(401).redirect('/api/login');
    }
};

module.exports.renderResetPassword = function (req, res) {
    if (!req.session.username) {
        res.status(200).render('forgetPassword', {
            email: "",
            success: "Enter the email you registered with, an email will be sent to it with instructions on how to reset your password."
        });
    } else {
        res.status(401).redirect('/api/login');
    }
};

module.exports.resetPassword = function (req, res) {
    if (!req.session.username) {
        var email = req.body.email;
        var idx = email.lastIndexOf('@');
        if (email) {
            var emailRegex = /^[\w-]+(\.[\w-]+)*@([a-z0-9-]+(\.[a-z0-9-]+)*?\.[a-z]{2,6}|(\d{1,3}\.){3}\d{1,3})(:\d{4})?$/;
            if (emailRegex.test(email)) {
                if (idx > -1 && email.slice(idx + 1) !== 'student.guc.edu.eg') {
                    return res.status(400).render("forgetPassword", {
                        error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                        email
                    });
                }
            } else {
                return res.status(400).render("forgetPassword", {
                    error: "You need to have a valid GUC Email, A valid GUC email is in the form of \"whatever@student.guc.edu.eg\"",
                    email
                });
            }
            var token = randtoken.generate(48);
            var content = "<p>A reset password request has been made, please reset the password to your account by clicking this <a href=\"http://guccoders.com/api/login/resetPassword/" + token + "\">Link</a>.<br>If you are unable to do so, copy and paste the following link into your browser:<br><br>http://guccoders.com/api/login/resetPassword/" + token + "<br><br>If you did not do the request then ignore this email and your password will remain unchanged.</p>";
            Student.findOne({
                email: email
            }, function (err, student) {
                if (err) {
                    res.status(400).render('forgetPassword', {
                        email: email,
                        error: "An unknown error occured!"
                    });
                } else if (student) {
                    sendEmail(email, content, "Password Reset", function (sent) {
                        if (sent) {
                            student.resetPasswordToken = token;
                            student.resetPasswordExpire = Date.now() + 3600000;
                            student.save(function (err) {
                                if (err) {
                                    res.status(400).render('forgetPassword', {
                                        email: email,
                                        error: "An unknown error occured!"
                                    });
                                } else {
                                    res.status(200).render('forgetPassword', {
                                        email: "",
                                        success: "An Email was sent successfully to " + email + ", check your inbox!"
                                    });
                                }
                            });
                        } else {
                            res.status(400).render('forgetPassword', {
                                email: email,
                                error: "Could not send the email, please try again."
                            });
                        }
                    });
                } else {
                    res.status(400).render('forgetPassword', {
                        email: email,
                        error: "Email is not associated with any existing account, please note that you cannot reset the password of an unverified account."
                    });
                }
            });
        }
    } else {
        res.status(401).redirect('/api/login');
    }
};

module.exports.renderHome = function (req, res) {
    if (req.session.username) {
        res.status(200).render('home', {
            username: "true"
        });
    } else {
        res.status(200).render('home');
    }
};

module.exports.renderChangePassword = function (req, res) {
    if (req.session.username) {
        res.status(401).render("login", {
            error: "You are already logged in to an account, you need to be logged out to perform this action.",
            usererror: ""
        });
    } else {
        Student.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: {
                $gt: Date.now()
            }
        }, function (err, student) {
            if (err || !student) {
                res.status(400).render("forgetPassword", {
                    error: "Your password reset request has expired, please make a new request to reset your password.",
                    email: ""
                });
            } else {
                res.status(200).render("changePassword", {
                    success: "Welcome " + student.username + ", You may now change you password."
                })
            }
        });
    }
};

module.exports.changePassword = function (req, res) {
    if (req.session.username) {
        res.status(401).render("login", {
            error: "You are already logged in to an account, you need to be logged out to perform this action.",
            usererror: ""
        });
    } else {
        Student.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpire: {
                $gt: Date.now()
            }
        }, function (err, student) {
            if (err || !student) {
                res.status(400).render("forgetPassword", {
                    error: "Your password reset request has expired, please make a new request to reset your password.",
                    email: ""
                });
            } else {
                var password = req.body.password;
                console.log();
                var confirmPassword = req.body.confirm_password;
                var passwordRegex = new RegExp("(?=^.{8,}$)((?=.*\\d)(?=.*\\W+))(?![.\\n])(?=.*[a-z]).*$");
                if (!passwordRegex.test(password)) {
                    return res.status(400).render("changePassword", {
                        error: "Password must contain at least 8 characters, including a digit and a special character.",
                    });
                } else if (password !== confirmPassword) {
                    return res.status(400).render("changePassword", {
                        error: "Passwords do not match.",
                    });
                }
                bcrypt.genSalt(8, function (err, salt) {
                    bcrypt.hash(password, salt, function (err, hash) {
                        student.password = hash;
                        student.resetPasswordToken = undefined;
                        student.resetPasswordExpire = undefined;
                        student.save(function (err) {
                            if (err) {
                                res.status(200).render("changePassword", {
                                    error: "An unknown error occured, please try again!"
                                });
                            } else {
                                var utc = new Date().toJSON().slice(0, 10).replace(/-/g, '/');
                                utc = utc.split("/").reverse().join("/");
                                var content = "<p>Hello,<br>This is a confirmation email that your password has been successfully changed at " + utc + " (UTC).</p>";
                                sendEmail(student.email, content, "Password Reset Confirmation", function (sent) {
                                    res.status(200).render("login", {
                                        success: "Your password was changed successfully.",
                                        usererror: ""
                                    });
                                });
                            }
                        });
                    });
                });
            }
        });
    }
};

var projectsHelper = function (student, max, j, callback) {
    if (j == max) {
        student.projectsLength = max;
        student.save(function (err) {
            callback();
        });
    } else {
        var project = {
            title: "Project" + (j + 1),
            description: "A test project generated by the awesome website developer!",
            URL: "http://google.com"
        };
        student.projects.push(project);
        projectsHelper(student, max, j + 1, callback);
    }
};


var recursiveFill = function (max, i, callback) {
    if (i == max)
        callback();
    else {
        var gender = i % 2 == 0 ? "Male" : "Female";
        var major = i % 2 == 0 ? "MET" : "BI";
        Student.create({
            username: "user" + (i + 1),
            password: "12345678",
            name: "User " + (i + 1),
            createdPortfolio: true,
            gucID: "34-" + (i + 1) + (i + 2) + (i + 3),
            email: "user" + (i + 1) + "@student.guc.edu.eg",
            gender: gender,
            major: major,
            description: "A test user generated by the awesome website developer!",
            normalizedName: "user" + (i + 1),
            projectsLength: 0
        }, function (err, student) {
            if (student) {
                projectsHelper(student, Math.floor(Math.random() * (50 - 1 + 1) + 1), 0, function () {
                    recursiveFill(max, i + 1, callback);
                });
            } else {
                recursiveFill(max, i + 1, callback);
            }
        });
    }
};

module.exports.fill = function (req, res) {
    if (req.session.username === "omardoma") {
        recursiveFill(Math.floor(Math.random() * (80 - 25 + 1) + 25), 0, function () {
            res.status(200).redirect("/api/browsePortfolios/1");
        });
    } else
        res.status(401).redirect("/api/home");
};
