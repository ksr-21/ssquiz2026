"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post('/login', admin_controller_1.login);
router.get('/stats', auth_middleware_1.authenticateAdmin, admin_controller_1.getDashboardStats);
exports.default = router;
