"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const domain_controller_1 = require("../controllers/domain.controller");
const router = (0, express_1.Router)();
router.get('/', domain_controller_1.getDomains);
exports.default = router;
