const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId : {type : String, required : true},
    role : {type : String, required : true},
    fullName : {type : String, required : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    // confirmPassword : {type : String, required : true},
    assignments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Assignment'},]
});

const assignmentSchema = new mongoose.Schema({
    id : {type : String, required : true},
    task : {type : String, required : true},
    userId : {type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true},
    adminId : {type : mongoose.Schema.Types.ObjectId, ref : 'Admin', required : true}
});

const adminSchema = new mongoose.Schema({
    adminId : {type : String, required : true},
    role : {type : String, required : true},
    name : {type : String, required : true},
    adminEmail : {type : String, required : true},
    adminPassword : {type : String, required : true},
    assignedAssignments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Assignment'}],
    acceptedAssignments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Assignment'}],
    rejectedAssignments : [{type : mongoose.Schema.Types.ObjectId, ref : 'Assignment'}]
});

const User = mongoose.model('User', userSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Admin = mongoose.model('Admin',  adminSchema);

module.exports = {
    User,
    Admin,
    Assignment
};