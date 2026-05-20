import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  exportCSV,
} from '../controllers/leads.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.post('/', requireRole(['Admin', 'Sales User']), createLead);
router.get('/', requireRole(['Admin', 'Sales User']), getLeads);
router.get('/export/csv', requireRole(['Admin', 'Sales User']), exportCSV);
router.get('/:id', requireRole(['Admin', 'Sales User']), getLeadById);
router.put('/:id', requireRole(['Admin', 'Sales User']), updateLead);

// DELETE is Admin only as specified in Role-Based Access Control
router.delete('/:id', requireRole(['Admin']), deleteLead);

export default router;
