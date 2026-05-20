"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leads_js_1 = require("../controllers/leads.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_js_1.requireAuth);
router.post('/', (0, auth_js_1.requireRole)(['Admin', 'Sales User']), leads_js_1.createLead);
router.get('/', (0, auth_js_1.requireRole)(['Admin', 'Sales User']), leads_js_1.getLeads);
router.get('/export/csv', (0, auth_js_1.requireRole)(['Admin', 'Sales User']), leads_js_1.exportCSV);
router.get('/:id', (0, auth_js_1.requireRole)(['Admin', 'Sales User']), leads_js_1.getLeadById);
router.put('/:id', (0, auth_js_1.requireRole)(['Admin', 'Sales User']), leads_js_1.updateLead);
// DELETE is Admin only as specified in Role-Based Access Control
router.delete('/:id', (0, auth_js_1.requireRole)(['Admin']), leads_js_1.deleteLead);
exports.default = router;
