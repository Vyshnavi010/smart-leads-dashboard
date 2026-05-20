"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.login = exports.register = void 0;
const user_js_1 = __importDefault(require("../models/user.js"));
const auth_js_1 = require("../utils/auth.js");
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'All fields (name, email, password) are required' });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ success: false, message: 'Invalid email format' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
            return;
        }
        const existingUser = await user_js_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'User with this email already exists' });
            return;
        }
        const requestedRole = role === 'Admin' ? 'Admin' : 'Sales User';
        const passwordHash = await (0, auth_js_1.hashPassword)(password);
        const newUser = new user_js_1.default({
            name,
            email,
            passwordHash,
            role: requestedRole,
        });
        await newUser.save();
        const token = (0, auth_js_1.generateToken)(newUser._id.toString(), newUser.role);
        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }
        const user = await user_js_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const isMatch = await (0, auth_js_1.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        const token = (0, auth_js_1.generateToken)(user._id.toString(), user.role);
        res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error during login' });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        const user = await user_js_1.default.findById(req.user.userId).select('-passwordHash');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error retrieving profile' });
    }
};
exports.getProfile = getProfile;
