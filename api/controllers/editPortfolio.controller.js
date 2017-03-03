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
        if (req.session.sc) {
            fs.unlink(req.session.sc, function (err) {
                delete req.session.sc;
            });
        }
        if (!err) {
            callback(true);
        } else {
            callback(false);
        }
    });
};

module.exports.getAllProjects = function (req, res) {
    if (req.session.username) {
        var username = req.session.username;
        Student.findOne({
            username: username
        }, function (err, student) {
            if (err) {
                res.status(400).render('editPortfolio', {
                    error: err.message,
                    max: req.params.pageNumber * 4
                });
            } else {
                if (!req.session.username) {
                    res.status(401).redirect("/api/login");
                } else {
                    var createdPortfolio = student.createdPortfolio;
                    if (createdPortfolio === true) {
                        var projects = student.projects;
                        var pageNumber = req.params.pageNumber;
                        if (isNaN(pageNumber))
                            pageNumber = 1;
                        else
                            pageNumber = parseInt(req.params.pageNumber);
                        if (pageNumber < 1 || pageNumber >= (projects.length / 4 + 1))
                            pageNumber = 1;
                        if (req.session.firstTime) {
                            req.session.firstTime = null;
                            res.status(200).render('editPortfolio', {
                                success: "Login Successful",
                                projects,
                                username: "true",
                                student,
                                max: pageNumber * 4
                            });
                        } else {
                            res.status(200).render('editPortfolio', {
                                projects,
                                username: "true",
                                student,
                                max: pageNumber * 4
                            });
                        }
                    } else {
                        res.status(401).redirect('/api/createPortfolio');
                    }
                }
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.createProject = function (req, res) {
    if (req.session.username) {
        var username = req.session.username;
        Student.findOne({
            username: username
        }, function (err, student) {
            var projects = student.projects;
            if (err) {
                res.status(400).render('editPortfolio', {
                    error: err.message,
                    username: "true",
                    projects,
                    student,
                    max: req.params.pageNumber * 4
                });
            } else {
                addProject(req, res, student, function (exit) {
                    if (exit === false) {
                        res.status(400).render("editPortfolio", {
                            username: "true",
                            error: "Please upload a screenshot or provide a link for your project or both!",
                            projects,
                            student,
                            max: req.params.pageNumber * 4
                        });
                    } else {
                        var page = Math.ceil(projects.length / 4);
                        res.status(200).redirect('/api/editPortfolio/' + page);
                    }
                });
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
}

module.exports.upload = function (req, res) {
    if (req.session.username) {
        var username = req.session.username;
        Student.findOne({
            username: username
        }, function (err, student) {
            var projects = student.projects;
            upload(req, res, function (err) {
                if (err) {
                    return res.status(400).render('editPortfolio', {
                        error: "Upload Failed!",
                        username: "true",
                        projects,
                        student,
                        max: req.params.pageNumber * 4
                    });
                }
                if (req.file) {
                    var string = req.file.originalname.substring(req.file.originalname.length - 3, req.file.originalname.length);
                    if (string === "peg")
                        string = "j" + string;
                    if (!(string === "png" || string === "jpg" || string === "jpeg")) {
                        fs.unlink(req.file.path);
                        return res.status(400).render('editPortfolio', {
                            error: "File format is not supported!",
                            student,
                            projects,
                            username: "true",
                            max: req.params.pageNumber * 4
                        });
                    }
                    var newPath = path.join(__dirname, "../", "../public/uploads/tmp" + "." + string);
                    fs.renameSync(req.file.path, newPath, function (err) {
                        if (err) throw err;
                        fs.unlink(req.file.path, function () {
                            if (err) {
                                throw err;
                            }
                        });
                    });

                    req.session.sc = newPath;
                    res.status(200).redirect('/api/editPortfolio/' + req.params.pageNumber + '/upload');
                } else {
                    if (req.session.sc) {
                        fs.unlink(req.session.sc);
                        delete req.session.sc;
                    }
                    res.status(400).render('editPortfolio', {
                        username: "true",
                        error: "Please choose a valid file!",
                        projects,
                        student,
                        max: req.params.pageNumber * 4
                    });
                }
            });
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.showImage = function (req, res) {
    if (req.session.username) {
        var username = req.session.username;
        Student.findOne({
            username: username
        }, function (err, student) {
            var projects = student.projects;
            var string = req.session.sc;
            var length = "/uploads/tmp.jpg".length;
            if (string.substring(string.length - 3) === "peg")
                length += 1;
            string = string.substring(string.length - length);
            res.status(200).render("editPortfolio", {
                filePath: string,
                success: "Upload Successful!",
                username: "true",
                projects,
                student,
                max: req.params.pageNumber * 4
            });
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};

module.exports.deleteProject = function (req, res) {
    if (req.session.username) {
        var id = req.params.projectID;
        Student.findOne({
            username: req.session.username
        }, function (err, student) {
            if (student.projects.length == 1) {
                var projects = student.projects;
                res.status(401).render("editPortfolio", {
                    error: "You cannot delete your only project, Your portfolio should contain at least one.",
                    student,
                    projects,
                    max: req.params.pageNumber * 4,
                    username: "true"
                });
            } else {
                student.projects.id(id).remove(function (err) {
                    if (!err) {
                        student.projectsLength = student.projectsLength - 1;
                        student.save(function (err) {
                            var page = Math.ceil(student.projects.length / 4);
                            res.status(200).redirect("/api/editPortfolio/" + page);
                        });
                    } else {
                        res.status(401).render("editPortfolio", {
                            error: "An error occured, could not delete project.",
                            student,
                            projects,
                            max: req.params.pageNumber * 4,
                            username: "true"
                        });
                    }
                });
            }
        });
    } else {
        res.status(401).redirect("/api/login");
    }
};