"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidate_controller_1 = require("../controllers/candidate.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/register', candidate_controller_1.registerCandidate);
router.get('/', auth_middleware_1.authenticateAdmin, candidate_controller_1.getCandidates);
exports.default = router;
