var mongoose = require("mongoose");
var Student = mongoose.model("Student");
var multer = require('multer');
var fs = require('fs');
var path = require('path');
var upload = multer({
    dest: path.join(__dirname, '../', '../public/uploads')
}).single('myfile');

var addProject = function (req, res, student, callback) {
    var title = req.body.title;
    var description = req.body.description;
    var URL = req.body.URL;
    var photo = req.session.sc;
    var contentType = null;
    if (!URL && !photo) {
        return callback(false);
    } else {
        if (photo) {
            var string = photo;
            var fileFormat = string.substring(string.length - 3, string.length);
            if (fileFormat === "peg")
                fileFormat = "j" + fileFormat;
            photo = (fs.readFileSync(photo)).toString('base64');
            contentType = "image/" + fileFormat;
        }
    }
    student.projects.push({
        title: title,
        description: description,
        URL: URL,
        screenshot: {
            photo: photo,
            contentType: contentType
        }
    });
    student.projectsLength = student.projectsLength + 1;
    student.save(function (err) {
        if (req.session.pp) {
            fs.unlink(req.session.pp, function (err) {
                delete req.session.pp;
            });
        }
        if (req.session.sc) {
            fs.unlink(req.session.sc, function (err) {
                delete req.session.sc;
            });
        }
        if (err) {
            callback(false);
        } else {
            delete req.session.name;
            delete req.session.description;
            delete req.session.gender;
            delete req.session.major;
            callback(true);
        }
    });
}

module.exports.uploadScreenshot = function (req, res) {
    if (req.session.username) {
        upload(req, res, function (err) {
            if (err) {
                return res.status(400).render('addProject', {
                    error: "Upload Failed!",
                    username: "true"
                });
            }
            if (req.file) {
                var string = req.file.originalname.substring(req.file.originalname.length - 3, req.file.originalname.length);
                if (string === "peg")
                    string = "j" + string;
                if (!(string === "png" || string === "jpg" || string === "jpeg")) {
                    fs.unlink(req.file.path);
                    return res.status(400).render('addProject', {
                        error: "File format is not supported!",
                        username: "true"
                    });
                }
                var newPath = path.join(__dirname, "../", "../public/uploads/tmpSC" + "." + string);
                fs.renameSync(req.file.path, newPath, function (err) {
                    if (err) throw err;
                    fs.unlink(req.file.path, function () {
                        if (err) {
                            throw err;
                        }
                    });
                });

                req.session.sc = newPath;
                res.status(200).redirect('/api/createPortfolio/addProject/upload');
            } else {
                if (req.session.sc) {
                    fs.unlink(req.session.sc);
                    delete req.session.sc;
                }
                res.status(400).render('addProject', {
                    username: "true",
                    error: "Please choose a valid file!"
                });
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.createPortfolio = function (req, res) {
    if (req.session.username) {
        var name = req.session.name;
        var description = req.session.description;
        var gender = req.session.gender;
        var major = req.session.major;
        Student.findOne({
            username: req.session.username
        }, function (err, user) {
            if (!err && user) {
                if (req.session.pp) {
                    var string = req.session.pp;
                } else
                    var string = path.join(__dirname, "../../public/images/user.png");
                var fileFormat = string.substring(string.length - 3, string.length);
                user.name = name;
                user.normalizedName = name.toLowerCase();
                user.gender = gender;
                user.major = major;
                user.description = description;
                user.profilePicture.photo = (fs.readFileSync(string)).toString("base64");
                user.profilePicture.contentType = "image/" + fileFormat;
                user.createdPortfolio = true;
                addProject(req, res, user, function (success) {
                    if (success === false)
                        res.status(400).render("addProject", {
                            username: "true",
                            error: "Please upload a screenshot or provide a link for your project or both!"
                        });
                    else
                        res.status(200).redirect('/api/editPortfolio/1');
                });
            } else {
                res.status(400).render('createPortfolio', {
                    error: "Could not create Portfolio, Please try again!",
                    username: "true"
                });
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.proceed = function (req, res) {
    if (req.session.username) {
        req.session.name = req.body.name;
        req.session.description = req.body.description;
        req.session.gender = req.body.gender;
        req.session.major = req.body.major;
        res.status(200).redirect('/api/createPortfolio/addProject');
    }
    else{
        res.status(401).redirect("/api/login");
    }
};

module.exports.showImage = function (req, res) {
    if (req.session.username && req.session.pp) {
        var string = req.session.pp;
        var length = "/uploads/tmpPP.jpg".length;
        if (string.substring(string.length - 3) === "peg")
            length += 1;
        string = string.substring(string.length - length);
        res.status(200).render("createPortfolio", {
            filePath: string,
            success: "Upload Successful!",
            username: "true"
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.showScreenshot = function (req, res) {
    if (req.session.username && req.session.sc) {
        var string = req.session.sc;
        var length = "/uploads/tmpSC.jpg".length;
        if (string.substring(string.length - 3) === "peg")
            length += 1;
        string = string.substring(string.length - length);
        res.status(200).render("addProject", {
            filePath: string,
            success: "Upload Successful!",
            username: "true"
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.renderAddProject = function (req, res) {
    if (!req.session.username) {
        res.status(401).redirect("/api/login");
    } else {
        if (req.session.name) {
            res.status(200).render('addProject', {
                username: "true"
            });
        } else {
            Student.findOne({
                username: req.session.username
            }, function (err, user) {
                if (user.createdPortfolio === true) {
                    res.status(401).redirect('/api/editPortfolio/1');
                } else {
                    res.status(401).redirect('/api/createPortfolio');
                }
            });
        }
    }
};

module.exports.upload = function (req, res) {
    if (req.session.username) {
        upload(req, res, function (err) {
            if (err) {
                return res.status(400).render('createPortfolio', {
                    error: "Upload Failed!",
                    username: "true"
                });
            }
            if (req.file) {
                var string = req.file.originalname.substring(req.file.originalname.length - 3, req.file.originalname.length);
                if (string === "peg")
                    string = "j" + string;
                if (!(string === "png" || string === "jpg" || string === "jpeg")) {
                    fs.unlink(req.file.path);
                    return res.status(400).render('createPortfolio', {
                        error: "File format is not supported!",
                        username: "true"
                    });
                }
                var newPath = path.join(__dirname, "../", "../public/uploads/tmpPP" + "." + string);
                fs.renameSync(req.file.path, newPath, function (err) {
                    if (err) throw err;
                    fs.unlink(req.file.path, function () {
                        if (err) {
                            throw err;
                        }
                    });
                });

                req.session.pp = newPath;
                res.status(200).redirect("/api/createPortfolio/upload");
            } else {
                if (req.session.pp) {
                    fs.unlink(req.session.pp);
                    delete req.session.pp;
                }
                res.status(400).render('createPortfolio', {
                    username: "true",
                    error: "Please choose a valid file!"
                });
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};