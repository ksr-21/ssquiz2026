"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomains = void 0;
const db_1 = __importDefault(require("../config/db"));
const getDomains = async (req, res) => {
    try {
        const domains = await db_1.default.domain.findMany({
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        });
        res.json(domains);
    }
    catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDomains = getDomains;
