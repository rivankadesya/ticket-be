const pool = require('../config/database');
const { validationResult } = require('express-validator');

const createTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority, assigned_to } = req.body;
    const created_by = req.userId;

    const result = await pool.query(
      'INSERT INTO tickets (title, description, category, priority, assigned_to, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, category, priority, assigned_to || null, created_by]
    );

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = `
      SELECT t.*, 
        u_assigned.name as assigned_to_name,
        u_created.name as created_by_name
      FROM tickets t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = $' + (params.length + 1);
      params.push(status);
    }
    if (priority) {
      query += ' AND t.priority = $' + (params.length + 1);
      params.push(priority);
    }
    if (category) {
      query += ' AND t.category = $' + (params.length + 1);
      params.push(category);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.status(200).json({
      message: 'Tickets retrieved successfully',
      count: result.rows.length,
      tickets: result.rows,
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketResult = await pool.query(
      `SELECT t.*, 
        u_assigned.name as assigned_to_name,
        u_created.name as created_by_name
      FROM tickets t
      LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
      LEFT JOIN users u_created ON t.created_by = u_created.id
      WHERE t.id = $1`,
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const commentsResult = await pool.query(
      `SELECT tc.*, u.name as user_name FROM ticket_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.ticket_id = $1 ORDER BY tc.created_at DESC`,
      [id]
    );

    res.status(200).json({
      message: 'Ticket retrieved successfully',
      ticket: ticketResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTicket = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, category, priority, status, assigned_to } = req.body;

    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];
    const updateFields = [];
    const updateParams = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      updateParams.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateParams.push(description);
    }
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateParams.push(category);
    }
    if (priority !== undefined) {
      updateFields.push(`priority = $${paramIndex++}`);
      updateParams.push(priority);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      updateParams.push(status);
    }
    if (assigned_to !== undefined) {
      updateFields.push(`assigned_to = $${paramIndex++}`);
      updateParams.push(assigned_to || null);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const updateQuery = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    const result = await pool.query(updateQuery, updateParams);

    res.status(200).json({
      message: 'Ticket updated successfully',
      ticket: result.rows[0],
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await pool.query('DELETE FROM tickets WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Ticket deleted successfully',
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    const metricsResult = await pool.query(`
      SELECT
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN priority = 'High' OR priority = 'Critical' THEN 1 ELSE 0 END) as high_priority_tickets
      FROM tickets
    `);

    res.status(200).json({
      message: 'Dashboard metrics retrieved successfully',
      metrics: metricsResult.rows[0],
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  getDashboardMetrics,
};
