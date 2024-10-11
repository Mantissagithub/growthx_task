const express = require('express');
const mongoose = require('mongoose');
const {User, Admin, Assignment} = require("../db/db");
const jwt = require('jsonwebtoken');
const {jwt_secret, authMiddleware} = require("../middleware/auth");
// const {authenticateMiddleware} = require("../middleware/auth");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post("/userRegister", async (req, res) => {
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
        console.error(error);
        return res.status(500).json({message : "Server error"});
    }
});

router.post("/userLogin", async(req, res) => {
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
        console.error(error);
        res.status(500).json({message : "Server error"});
    }
});

router.post("/upload", authMiddleware(['user']), async (req, res) => {
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

router.get("/admins", authMiddleware(['user']), async(req, res) => {
    // const user = req.user;
    try {
        const admins = await Admin.find({}, 'adminId name adminEmail');
        return res.status(200).json({admins});
    } catch (error) {
        console.error(error);
        return res.status(500).json({message : "Server error"});
    }
});

module.exports = router;