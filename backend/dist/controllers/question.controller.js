"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.addQuestion = exports.getQuestionsByDomain = void 0;
const db_1 = __importDefault(require("../config/db"));
const getQuestionsByDomain = async (req, res) => {
    try {
        const { domainId } = req.params;
        const questions = await db_1.default.question.findMany({
            where: { domainId }
        });
        res.json(questions);
    }
    catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getQuestionsByDomain = getQuestionsByDomain;
const addQuestion = async (req, res) => {
    try {
        const { domainId, text, options, correctOption, marks } = req.body;
        // Basic validation
        if (!domainId || !text || !options || options.length !== 4 || correctOption === undefined) {
            return res.status(400).json({ error: 'Invalid question data' });
        }
        const question = await db_1.default.question.create({
            data: {
                domainId,
                text,
                options,
                correctOption,
                marks: marks || 1
            }
        });
        res.status(201).json(question);
    }
    catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addQuestion = addQuestion;
const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.default.question.delete({
            where: { id }
        });
        res.json({ message: 'Question deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.deleteQuestion = deleteQuestion;
