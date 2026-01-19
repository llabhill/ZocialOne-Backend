const express = require('express');
const authMiddleware = require('../middleware/auth');

const {
  raiseTicket,
  updateStatus,
  getMetrics,
  getUserComplaints,
} = require('../controllers/complaintController');

const router = express.Router();

router.get('/', authMiddleware, getUserComplaints);

router.post('/raise-ticket', authMiddleware, raiseTicket);

router.patch('/:id/status', authMiddleware, updateStatus);

router.get('/:id/metrics', authMiddleware, getMetrics);

module.exports = router;
