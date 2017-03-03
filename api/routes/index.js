var express = require("express");
var router = express.Router();
var userCtrl = require("../controllers/user.controller");
var viewPortfoliosCtrl = require("../controllers/viewPortfolios.controller");
var editPortfolioCtrl = require("../controllers/editPortfolio.controller");
var createPortfolioCtrl = require("../controllers/createPortfolio.controller");

router.route("/login").get(userCtrl.renderLogin).post(userCtrl.login);
router.route("/login/forgetPassword").get(userCtrl.renderResetPassword).post(userCtrl.resetPassword);
router.route("/login/resetPassword/:token").get(userCtrl.renderChangePassword).post(userCtrl.changePassword);
router.route("/verifyAccount/:url").get(userCtrl.renderUnverified);
router.route("/resendVerification").get(userCtrl.renderResendVerification).post(userCtrl.resendVerification);
router.route("/register").get(userCtrl.renderRegister).post(userCtrl.register);
router.route("/home").get(userCtrl.renderHome);
router.route("/browsePortfolios/:pageNumber").get(viewPortfoliosCtrl.getPortfolios);
router.route("/students/:username/:pageNumber").get(viewPortfoliosCtrl.getProjects);
router.route("/students/:username/projects/:projectID").get(viewPortfoliosCtrl.getProject);
router.route("/logout").get(userCtrl.logOut);
router.route("/editPortfolio/:pageNumber").get(editPortfolioCtrl.getAllProjects).post(editPortfolioCtrl.upload);
router.route("/editPortfolio/:pageNumber/delete/:projectID").post(editPortfolioCtrl.deleteProject);
router.route("/editPortfolio/:pageNumber/upload").get(editPortfolioCtrl.showImage).post(editPortfolioCtrl.createProject);
router.route("/createPortfolio").get(userCtrl.renderCreatePortfolio).post(createPortfolioCtrl.upload);
router.route("/createPortfolio/upload").get(createPortfolioCtrl.showImage).post(createPortfolioCtrl.proceed);
router.route("/createPortfolio/addProject").get(createPortfolioCtrl.renderAddProject).post(createPortfolioCtrl.uploadScreenshot);
router.route("/createPortfolio/addProject/upload").get(createPortfolioCtrl.showScreenshot).post(createPortfolioCtrl.createPortfolio);
router.route("/fill").get(userCtrl.fill);

module.exports = router;