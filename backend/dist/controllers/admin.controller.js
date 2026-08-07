"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await db_1.default.adminUser.findUnique({
            where: { username }
        });
        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, admin.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, username: admin.username, role: admin.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: admin.id,
                username: admin.username,
                role: admin.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.login = login;
const getDashboardStats = async (req, res) => {
    try {
        const totalCandidates = await db_1.default.candidate.count();
        const completedAssessments = await db_1.default.assessmentSession.count({
            where: { status: 'COMPLETED' }
        });
        // Additional stats can be aggregated here
        res.json({
            totalCandidates,
            completedAssessments,
            liveCandidates: 0, // Placeholder
            averageScore: 0, // Placeholder
            highestScore: 0, // Placeholder
            lowestScore: 0 // Placeholder
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDashboardStats = getDashboardStats;
