const express = require('express');
const mongoose = require('mongoose');
const {User, Admin, Assignment} = require("../db/db");
const jwt = require('jsonwebtoken');
const {jwt_secret, authMiddleware} = require("../middleware/auth");
// const {authenticateMiddleware} = require("../middleware/auth");
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post("/adminRegister", async(req, res) => {
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

router.post("/adminLogin", async(req, res) => {
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

router.get("/assignments", authMiddleware(['admin']), async(req, res) => {
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

router.post("/assignments/:id/accept", authMiddleware(['admin']), async(req, res) => {
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

router.post("/assignments/:id/reject", authMiddleware(['admin']), async(req, res) => {
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

module.exports = router;
