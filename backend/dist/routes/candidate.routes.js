"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const candidate_controller_1 = require("../controllers/candidate.controller");
const router = (0, express_1.Router)();
router.post('/register', candidate_controller_1.registerCandidate);
exports.default = router;
