const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getDashboardMetrics,
} = require('../controllers/ticketController');
const { validateCreateTicket, validateUpdateTicket } = require('../utils/validators');
const { verifyToken } = require('../middleware/auth');

router.post('/', verifyToken, validateCreateTicket, createTicket);
router.get('/', verifyToken, getTickets);
router.get('/metrics', verifyToken, getDashboardMetrics);
router.get('/:id', verifyToken, getTicketById);
router.put('/:id', verifyToken, validateUpdateTicket, updateTicket);
router.delete('/:id', verifyToken, deleteTicket);

module.exports = router;
