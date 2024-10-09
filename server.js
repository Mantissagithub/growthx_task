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
const PORT = 3000;

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
        res.json({message : "User registered successfully" ,token});
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
        res.json({message : "User logged in successfully" ,token});
    } catch (error) {
        res.status(500).json({message : "Server error"});
    }
});

app.post("/upload", authMiddleware(['user']), async (req, res) => {
    const { task, adminEmail } = req.body;
    const userId = req.user.userId; // Get userId from authenticated user
    const id = uuidv4(); // Generate a unique ID for the assignment

    try {
        const user = await User.findOne({ userId }); // Find user by custom userId
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const admin = await Admin.findOne({ adminEmail });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        // Create a new assignment using ObjectIds
        const newAssignment = new Assignment({
            id,
            task,
            userId: user._id, // Use MongoDB ObjectId here
            adminId: admin._id // Use MongoDB ObjectId here
        });

        await newAssignment.save();

        // Push the ObjectId of the new assignment instead of an object
        user.assignments.push(newAssignment._id);
        admin.assignedAssignments.push(newAssignment._id);

        await user.save();
        await admin.save();

        res.status(200).json({ message: "Assignment uploaded" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
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

//admin routes

app.post("/adminRegister", async(req, res) => {
    const {name, email, password, confirmPassword} = req.body;

    if(password !== confirmPassword){
        return res.status(400).json({message : "Passwords do not match"});
    }

    try {
        const existingAdmin = await Admin.findOne({email});
        if(existingAdmin){
            return res.status(400).json({message : "Admin already exists"});
        }

        const adminId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({adminId, name, adminEmail:email, adminPassword:hashedPassword, role:"admin"});
        await newAdmin.save();

        const token = jwt.sign({adminId, email, role : "admin"}, jwt_secret, {expiresIn : '1h'});
        res.status(200).json({message : "Admin registered successfully", token});
    } catch (error) {
        console.error(error);
        res.status(500).json({message : "Server error"});
    }
});

app.post("/adminLogin", async(req, res) => {
    const {email, password} = req.body;

    try {
        const admin = await Admin.findOne({adminEmail: email});
        // const adminId = admin.adminId;
        if(!admin){
            return res.status(400).json({message : "Email not found"});
        }

        const validPassword = await bcrypt.compare(password, admin.adminPassword);
        if(!validPassword){
            return res.status(400).json({message : "Passowrd is incorrect"});
        }

        const token = jwt.sign({ adminId: admin.adminId, email, role :"admin"}, jwt_secret, {expiresIn : '1h'});
        res.status(200).json({message : "Admin logged in successfully" ,token});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message : "Server error"});
    }
});

app.get("/assignments", authMiddleware(['admin']), async(req, res) => {
    try {
        const admin = await Admin.findOne({adminId: req.user.adminId}).populate('assignedAssignments', 'id task');
        const assignments = admin.assignedAssignments.map(assignment => ({
            id : assignment.id,
            task : assignment.task
        }));
        res.json({assignments});
    } catch (error) {
        console.error(error);
        return res.status(500).json({messsage : "Server error"});
    }
});

app.post("/assignments/:id/accept", authMiddleware(['admin']), async(req, res) => {
    try {
        // const assignmentId = req.params.id;
        const assignment = await Assignment.findOne({id : req.params.id});
        if(!assignment){
            return res.status(400).json({message : "Assignment not found"});
        }
        const admin = await Admin.findOne({adminId : req.user.adminId});
        admin.acceptedAssignments.push(assignment);
        await admin.save();
        res.status(200).json({message : "Admin accepted the assignment"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message : "Server error"});
    }
});

app.post("/assignments/:id/reject", authMiddleware(['admin']), async(req, res) => {
    try {
        // const assignmentId = req.params.id;
        const assignment = await Assignment.findOne({id : req.params.id});
        if(!assignment){
            return res.status(400).json({message : "Assignment not found"});
        }
        const admin = await Admin.findOne({adminId : req.user.adminId});
        admin.rejectedAssignments.push(assignment);
        await admin.save();
        res.status(200).json({message : "Admin rejected the assignment"});
    } catch (error) {
        return res.status(500).json({message : "Server error"});
    }
});

app.listen(PORT, () => {
    console.log("Server is running on port " + PORT);
});