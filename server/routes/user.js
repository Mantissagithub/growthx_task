const express = require('express');
const mongoose = require('mongoose');
const { User, Admin, Assignment } = require("../db/db");
const jwt = require('jsonwebtoken');
const { jwt_secret, authMiddleware } = require("../middleware/auth");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// register a new user
router.post("/userRegister", async (req, res) => {
    const { fullName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "passwords do not match" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "user already exists" });
        }

        const userId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: hashedPassword, userId, role: "user" });
        await newUser.save();

        const token = jwt.sign({ userId, email, role: "user" }, jwt_secret, { expiresIn: '1h' });
        res.json({ message: "user registered successfully", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "server error" });
    }
});

// login an existing user
router.post("/userLogin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "email not found" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ message: "incorrect password" });
        }

        const token = jwt.sign({ userId: user.userId, email, role: user.role }, jwt_secret, { expiresIn: '1h' });
        res.json({ message: "user logged in successfully", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "server error" });
    }
});

// upload an assignment
router.post("/upload", authMiddleware(['user']), async (req, res) => {
    const { task, adminEmail } = req.body;
    const userId = req.user.userId;
    const id = uuidv4();

    try {
        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }

        const admin = await Admin.findOne({ adminEmail });
        if (!admin) {
            return res.status(404).json({ message: "admin not found" });
        }

        const newAssignment = new Assignment({
            id,
            task,
            userId: user._id,
            adminId: admin._id
        });

        await newAssignment.save();

        user.assignments.push(newAssignment._id);
        admin.assignedAssignments.push(newAssignment._id);

        await Promise.all([user.save(), admin.save()]);

        res.status(200).json({ message: "assignment uploaded successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "server error" });
    }
});

// get all admins
router.get("/admins", authMiddleware(['user']), async (req, res) => {
    try {
        const admins = await Admin.find({}, 'adminId name adminEmail');
        return res.status(200).json({ admins });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "server error" });
    }
});

// get current user's details
router.get("/me", authMiddleware(['user']), async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId }).select('-password');
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "server error" });
    }
});

// update user's information
router.put("/update", authMiddleware(['user']), async (req, res) => {
    const { fullName, email } = req.body;

    try {
        const updatedUser = await User.findOneAndUpdate(
            { userId: req.user.userId },
            { fullName, email },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "user not found" });
        }

        return res.status(200).json(updatedUser);
    } catch (error) {
       console.error(error);
       return res.status(500).json({ message: "server error" });
   }
});

// delete a user's account
router.delete("/delete", authMiddleware(['user']), async (req, res) => {
    try {
       const deletedUser = await User.findOneAndDelete({ userId: req.user.userId });

       if (!deletedUser) {
           return res.status(404).json({ message: "user not found" });
       }

       // optional handling of user's assignments can be done here

       return res.status(200).json({ message: "user account deleted successfully." });
   } catch (error) {
       console.error(error);
       return res.status(500).json({ message: "server error" });
   }
});

module.exports = router;