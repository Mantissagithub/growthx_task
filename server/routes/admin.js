const express = require('express');
const mongoose = require('mongoose');
const { User, Admin, Assignment } = require("../db/db");
const jwt = require('jsonwebtoken');
const { jwt_secret, authMiddleware } = require("../middleware/auth");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// register a new admin
router.post("/adminRegister", async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
        const existingAdmin = await Admin.findOne({ adminEmail: email });
        if (existingAdmin) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        const adminId = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            adminId,
            name,
            adminEmail: email,
            adminPassword: hashedPassword,
            role: "admin"
        });
        await newAdmin.save();

        const token = jwt.sign({ adminId, email, role: "admin" }, jwt_secret, { expiresIn: '1h' });
        res.status(200).json({ message: "Admin registered successfully", token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// login an existing admin
router.post("/adminLogin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ adminEmail: email });
        if (!admin) {
            return res.status(400).json({ message: "Email not found" });
        }

        const validPassword = await bcrypt.compare(password, admin.adminPassword);
        if (!validPassword) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        const token = jwt.sign({ adminId: admin.adminId, email, role: "admin" }, jwt_secret, { expiresIn: '1h' });
        res.status(200).json({ message: "Admin logged in successfully", token });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// retrieve all admins
router.get("/admins", authMiddleware(['admin']), async (req, res) => {
    try {
        const admins = await Admin.find().select("adminId name adminEmail createdAt");
        res.status(200).json({ admins });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// update an admin's profile
router.put("/adminProfile", authMiddleware(['admin']), async (req, res) => {
    const { name, email, password, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({ adminId: req.user.adminId });

        if (password && newPassword) {
            const validPassword = await bcrypt.compare(password, admin.adminPassword);
            if (!validPassword) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            admin.adminPassword = await bcrypt.hash(newPassword, 10);
        }

        admin.name = name || admin.name;
        admin.adminEmail = email || admin.adminEmail;

        await admin.save();
        res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// fetch all assignments
router.get("/assignments", authMiddleware(['admin']), async (req, res) => {
    try {
        const assignments = await Assignment.find().populate('userId adminId', 'fullName name');
        res.status(200).json({ assignments });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// accept an assignment
router.post("/assignments/:id/accept", authMiddleware(['admin']), async (req, res) => {
    try {
        const assignment = await Assignment.findOne({ id: req.params.id });
        if (!assignment) {
            return res.status(400).json({ message: "Assignment not found" });
        }

        assignment.status = 'accepted';
        await assignment.save();

        const admin = await Admin.findOne({ adminId: req.user.adminId });
        admin.acceptedAssignments.push(assignment);
        await admin.save();

        res.status(200).json({ message: "Assignment accepted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// reject an assignment
router.post("/assignments/:id/reject", authMiddleware(['admin']), async (req, res) => {
    try {
         const assignment = await Assignment.findOne({ id: req.params.id });
         if (!assignment) {
             return res.status(400).json({ message: "Assignment not found" });
         }

         assignment.status = 'rejected';
         await assignment.save();

         const admin = await Admin.findOne({ adminId: req.user.adminId });
         admin.rejectedAssignments.push(assignment);
         await admin.save();

         res.status(200).json({ message: "Assignment rejected" });
     } catch (error) {
         return res.status(500).json({ message: "Server error" });
     }
});

// mark an assignment as completed
router.post("/assignments/:id/complete", authMiddleware(['admin']), async (req, res) => {
    try {
         const assignment = await Assignment.findOne({ id: req.params.id });
         if (!assignment) {
             return res.status(400).json({ message: "Assignment not found" });
         }

         assignment.status = 'completed';
         await assignment.save();

         // optional logic for managing completed assignments can be added here

         res.status(200).json({ message: "Assignment marked as completed" });
     } catch (error) {
         console.error(error);
         return res.status(500).json({ message: "Server error" });
     }
});

// update an assignment's status to pending
router.post("/assignments/:id/pending", authMiddleware(['admin']), async (req, res) => {
    try {
         const assignment = await Assignment.findOne({ id: req.params.id });
         if (!assignment) {
             return res.status(400).json({ message: "Assignment not found" });
         }

         assignment.status = 'pending';
         await assignment.save();

         res.status(200).json({ message: "Assignment status updated to pending" });
     } catch (error) {
         return res.status(500).json({ message: "Server error" });
     }
});

module.exports = router;