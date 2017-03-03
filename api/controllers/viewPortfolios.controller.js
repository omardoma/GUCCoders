var mongoose = require("mongoose");
var Student = mongoose.model("Student");

module.exports.getPortfolios = function (req, res) {
    var sortType = "normalizedName";
    if (req.query && req.query.sort === "projects") {
        sortType = {
            projectsLength: "desc"
        };
    }
    Student.find({
        createdPortfolio: "true"
    }).sort(sortType).exec(function (err, students) {
        if (err) {
            res.status(400).render('browsePortfolios', {
                error: "Could not get portfolios, please try again later!"
            });
        } else {
            var pageNumber = req.params.pageNumber;
            if (isNaN(pageNumber))
                pageNumber = 1;
            else
                pageNumber = parseInt(req.params.pageNumber);
            if (pageNumber < 1 || pageNumber >= (students.length / 12 + 1))
                pageNumber = 1;
            if (req.session.username) {
                if (sortType === "normalizedName") {
                    res.status(200).render('browsePortfolios', {
                        students,
                        username: "true",
                        max: pageNumber * 12,
                        alpha: "hi"
                    });
                } else {
                    res.status(200).render('browsePortfolios', {
                        students,
                        username: "true",
                        max: pageNumber * 12,
                        projects: "hi"
                    });
                }
            } else {
                if (sortType === "normalizedName") {
                    res.status(200).render('browsePortfolios', {
                        students,
                        max: pageNumber * 12,
                        alpha: "hi"
                    });
                } else {
                    res.status(200).render('browsePortfolios', {
                        students,
                        max: pageNumber * 12,
                        projects: "hi"
                    });
                }
            }
        }
    });
};

module.exports.getProjects = function (req, res) {
    var username = req.params.username;
    Student.findOne({
        username: username
    }, function (err, student) {
        if (err) {
            res.status(400).render('studentProfile', {
                error: err.message
            });
        } else {
            if (student) {
                var projects = student.projects;
                var pageNumber = req.params.pageNumber;
                if (isNaN(pageNumber))
                    pageNumber = 1;
                else
                    pageNumber = parseInt(req.params.pageNumber);
                if (pageNumber < 1 || pageNumber >= (projects.length / 12 + 1))
                    pageNumber = 1;
                if (req.session.username) {
                    res.status(200).render('studentProfile', {
                        projects,
                        student,
                        username: "true",
                        max: pageNumber * 12
                    });
                } else {
                    res.status(200).render('studentProfile', {
                        student,
                        projects,
                        max: pageNumber * 12
                    });
                }
            } else {
                res.status(200).redirect('/');
            }
        }
    });
};


module.exports.getProject = function (req, res) {
    var username = req.params.username;
    var id = req.params.projectID;
    Student.findOne({
        username: username
    }, function (err, student) {
        if (err) {
            res.status(400).render('viewProject', {
                error: err.message
            });
        } else {
            if (student) {
                var project = student.projects.id(id);
                if (req.session.username) {
                    res.status(200).render('viewProject', {
                        project,
                        student,
                        username: "true"
                    });
                } else {
                    res.status(200).render('viewProject', {
                        student,
                        project
                    });
                }
            }
        }
    });
};