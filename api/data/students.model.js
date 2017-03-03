var mongoose = require('mongoose');

var projectSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true
	},
	URL: String,
	screenshot: {
		photo: Buffer,
		uploadDate: {
			type: Date,
			default: Date.now
		},
		contentType: String
	}
});

var studentSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	gucID: {
		type: String,
		required: true,
		unique : true
	},
	name: String,
	normalizedName : String,
	gender: String,
	major : String,
	profilePicture: {
		photo: Buffer,
		contentType: String
	},
	createdPortfolio: Boolean,
	description: String,
	resetPasswordToken: String,
	resetPasswordExpire: Date,
	projects: [projectSchema],
	projectsLength : Number
});

//Compile Schema into a model
mongoose.model("Student", studentSchema);