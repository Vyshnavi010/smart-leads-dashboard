"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportCSV = exports.deleteLead = exports.updateLead = exports.getLeadById = exports.getLeads = exports.createLead = void 0;
const lead_js_1 = __importDefault(require("../models/lead.js"));
// Helper to validate email structure
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
// Create a Lead
const createLead = async (req, res) => {
    try {
        const { name, email, status, source } = req.body;
        if (!name || !email || !source) {
            res.status(400).json({ success: false, message: 'Name, email, and source are required' });
            return;
        }
        if (!isValidEmail(email)) {
            res.status(400).json({ success: false, message: 'Invalid email format' });
            return;
        }
        const validSources = ['Website', 'Instagram', 'Referral'];
        if (!validSources.includes(source)) {
            res.status(400).json({ success: false, message: `Source must be one of: ${validSources.join(', ')}` });
            return;
        }
        if (status) {
            const validStatuses = ['New', 'Contacted', 'Qualified', 'Lost'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
                return;
            }
        }
        const newLead = new lead_js_1.default({
            name,
            email,
            status: status || 'New',
            source,
        });
        await newLead.save();
        res.status(201).json({
            success: true,
            data: newLead,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error creating lead' });
    }
};
exports.createLead = createLead;
// Read/Get Leads (With Pagination, Sort, Filter, Search)
const getLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { status, source, search, sortBy } = req.query;
        // Build filter query object
        const filterQuery = {};
        if (status) {
            filterQuery.status = status;
        }
        if (source) {
            filterQuery.source = source;
        }
        if (search) {
            const searchStr = search;
            filterQuery.$or = [
                { name: { $regex: searchStr, $options: 'i' } },
                { email: { $regex: searchStr, $options: 'i' } },
            ];
        }
        // Sorting
        let sortOptions = { createdAt: -1 }; // default to latest
        if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };
        }
        const totalLeads = await lead_js_1.default.countDocuments(filterQuery);
        const leads = await lead_js_1.default.find(filterQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);
        const totalPages = Math.ceil(totalLeads / limit);
        res.status(200).json({
            success: true,
            data: leads,
            pagination: {
                totalRecords: totalLeads,
                currentPage: page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error fetching leads' });
    }
};
exports.getLeads = getLeads;
// View Single Lead Details
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await lead_js_1.default.findById(id);
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: lead,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error retrieving lead details' });
    }
};
exports.getLeadById = getLeadById;
// Update Lead
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, status, source } = req.body;
        const lead = await lead_js_1.default.findById(id);
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        if (email && !isValidEmail(email)) {
            res.status(400).json({ success: false, message: 'Invalid email format' });
            return;
        }
        if (source) {
            const validSources = ['Website', 'Instagram', 'Referral'];
            if (!validSources.includes(source)) {
                res.status(400).json({ success: false, message: `Source must be one of: ${validSources.join(', ')}` });
                return;
            }
        }
        if (status) {
            const validStatuses = ['New', 'Contacted', 'Qualified', 'Lost'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
                return;
            }
        }
        // Apply updates
        if (name !== undefined)
            lead.name = name;
        if (email !== undefined)
            lead.email = email;
        if (status !== undefined)
            lead.status = status;
        if (source !== undefined)
            lead.source = source;
        await lead.save();
        res.status(200).json({
            success: true,
            data: lead,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error updating lead' });
    }
};
exports.updateLead = updateLead;
// Delete Lead (Admin Only restriction check in Router layer)
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await lead_js_1.default.findByIdAndDelete(id);
        if (!lead) {
            res.status(404).json({ success: false, message: 'Lead not found' });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Lead deleted successfully',
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error deleting lead' });
    }
};
exports.deleteLead = deleteLead;
// Export Leads to CSV
const exportCSV = async (req, res) => {
    try {
        const { status, source, search, sortBy } = req.query;
        // Use same query filters as getLeads to export the active search/filter view
        const filterQuery = {};
        if (status)
            filterQuery.status = status;
        if (source)
            filterQuery.source = source;
        if (search) {
            const searchStr = search;
            filterQuery.$or = [
                { name: { $regex: searchStr, $options: 'i' } },
                { email: { $regex: searchStr, $options: 'i' } },
            ];
        }
        let sortOptions = { createdAt: -1 };
        if (sortBy === 'oldest') {
            sortOptions = { createdAt: 1 };
        }
        const leads = await lead_js_1.default.find(filterQuery).sort(sortOptions);
        // Format fields to avoid CSV breakages (wrap in quotes and escape internal quotes)
        const escapeCSV = (val) => {
            if (val === null || val === undefined)
                return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        // Construct CSV content
        const headers = ['ID', 'Name', 'Email', 'Status', 'Source', 'Created At'];
        const rows = leads.map((lead) => [
            lead._id.toString(),
            escapeCSV(lead.name),
            escapeCSV(lead.email),
            escapeCSV(lead.status),
            escapeCSV(lead.source),
            lead.createdAt.toISOString(),
        ]);
        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=leads_export.csv');
        res.status(200).send(csvContent);
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error exporting CSV' });
    }
};
exports.exportCSV = exportCSV;
