"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const domain_routes_1 = __importDefault(require("./routes/domain.routes"));
const question_routes_1 = __importDefault(require("./routes/question.routes"));
const candidate_routes_1 = __importDefault(require("./routes/candidate.routes"));
const assessment_routes_1 = __importDefault(require("./routes/assessment.routes"));
// Basic health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});
app.use('/api/admin', admin_routes_1.default);
app.use('/api/domains', domain_routes_1.default);
app.use('/api/questions', question_routes_1.default);
app.use('/api/candidates', candidate_routes_1.default);
app.use('/api/assessment', assessment_routes_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
exports.default = app;
