const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['user', 'admin'] },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    assignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const assignmentSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    task: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
    adminId: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['admin'] },
    name: { type: String, required: true },
    adminEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    adminPassword: { type: String, required: true },
    assignedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    acceptedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    rejectedAssignments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

userSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

assignmentSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

adminSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const User = mongoose.model('User', userSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
    User,
    Admin,
    Assignment
};