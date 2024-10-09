const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const bcrypt = require("bcrypt");

const app = express();

app.use(cors());
app.use(express.json());

const jwt_secret = "Secr3T";

mongoose
  .connect('mongodb+srv://mantissa6789:Mantis%402510@cluster0.9ramotn.mongodb.net/growthx_task')
  .then(() => console.log("MongoDB connected..."))
  .catch(() => console.log("Couldn't connect to MongoDB..."));

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

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if(authHeader){
            const token = authHeader.split(' ')[1];
            jwt.verify(token, jwt_secret, (err, decoded) => {
                if(err){
                    return res.status(403).json({message : "Token is invalid"});
                }
                req.user = decoded;
                next();
            });
        }else{
            res.status(401).json({message : "Access denied"});
        }
    };
};

app.post("/userRegister", async (req, res) => {
    const {fullName, email, password, confirmPassword} = req.body;

    if(password !== confirmPassword){
        return res.status(400).json({message : "Passwords do not match"});
    }

    try {
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message : "User already exists"});
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({fullName, email, password : hashedPassword, userId, role : "user"});
        await newUser.save();

        const token = jwt.sign({userId, email, role : "user"}, jwt_secret, {expiresIn : '1h'});
        res.json({token});
    } catch (error) {
        return res.status(500).json({message : "Server error"});
    }
});

app.post("/userLogin", async(req, res) => {
    const {email, password} = req.body;

    try {
        const user = await User.findOne({email});
        const userId = user.userId;
        if(!user){
            return res.status(400).json({message : "Email is not found"});
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if(!validPassword){
            return res.status(400).json({message : "Password is incorrect"});
        }

        const token = jwt.sign({userId, email, role : user.role}, jwt_secret,{expiresIn : '1h'});
        res.json({token});
    } catch (error) {
        res.status(500).json({message : "Server error"});
    }
});

app.post("/upload", authMiddleware(['user']), async(req, res) => {
    const {task, adminEmail} = req.body;
    const userId = req.user.userId;
    const id = uuidv4();
    const user = await User.findOne({userId});
    const admin = await Admin.findOne({adminEmail});
    const newAssignment = new Assignment({id, task, userId, adminId : admin.adminId});
    await newAssignment.save();
    user.assignments.push({id, task});
    admin.assignedAssignments.push({id, task});
    await user.save();
    await admin.save();
    res.status(200).json({message : "Assignment uploaded"});
});

app.get("/admins", authMiddleware(['user']), async(req, res) => {
    // const user = req.user;
    try {
        const admins = await Admin.find({}, 'adminId name adminEmail');
        return res.status(200).json({admins});
    } catch (error) {
        return res.status(500).json({message : "Server error"});
    }
});


