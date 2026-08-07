"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCandidate = void 0;
const db_1 = __importDefault(require("../config/db"));
const registerCandidate = async (req, res) => {
    try {
        const { fullName, email, mobileNumber, college, yearOfStudy, branch, linkedInProfile, declarationAccepted, domainIds } = req.body;
        if (!fullName || !email || !mobileNumber || !college || !yearOfStudy || !branch || !declarationAccepted) {
            return res.status(400).json({ error: 'All mandatory fields must be filled.' });
        }
        if (!domainIds || domainIds.length < 1 || domainIds.length > 3) {
            return res.status(400).json({ error: 'You must select between 1 and 3 domains.' });
        }
        // Check if candidate already exists
        const existingCandidate = await db_1.default.candidate.findUnique({
            where: { email }
        });
        if (existingCandidate) {
            return res.status(400).json({ error: 'Candidate with this email already registered.' });
        }
        // Create Candidate and their Domain selections
        const candidate = await db_1.default.candidate.create({
            data: {
                fullName,
                email,
                mobileNumber,
                college,
                yearOfStudy,
                branch,
                linkedInProfile,
                declarationAccepted,
                domains: {
                    create: domainIds.map((domainId) => ({
                        domain: { connect: { id: domainId } }
                    }))
                }
            },
            include: {
                domains: true
            }
        });
        res.status(201).json({
            message: 'Registration successful',
            candidateId: candidate.id
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.registerCandidate = registerCandidate;
