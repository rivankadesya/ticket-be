const pool = require('../config/database');
const { validationResult } = require('express-validator');
const { emit } = require('../services/socketEmitter');

const createTicket = async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, category, priority, status, assigned_to } = req.body;
    const created_by = req.userId;
    const finalStatus = status || 'Open';

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO tickets (title, description, category, priority, status, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, category, priority, finalStatus, created_by]
    );
    const ticket = result.rows[0];

    // assigned_to is expected to be an array of user IDs
    if (Array.isArray(assigned_to) && assigned_to.length > 0) {
      for (const userId of assigned_to) {
        await client.query(
          'INSERT INTO ticket_assignments (ticket_id, user_id) VALUES ($1, $2)',
          [ticket.id, userId]
        );
      }
    }

    await client.query('COMMIT');

    emit(req.app.get('io'), 'tickets', 'created', { ticket_id: ticket.id });

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, category, dateFrom, dateTo } = req.query;
    let query = `
      SELECT t.*, 
        u_created.name as created_by_name,
        COALESCE(
          json_agg(
            json_build_object('id', u_assigned.id, 'name', u_assigned.name)
          ) FILTER (WHERE u_assigned.id IS NOT NULL),
          '[]'
        ) as assignees
      FROM tickets t
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
      LEFT JOIN users u_assigned ON ta.user_id = u_assigned.id
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
    if (dateFrom) {
      query += ' AND t.created_at >= $' + (params.length + 1);
      params.push(dateFrom);
    }
    if (dateTo) {
      query += ' AND t.created_at < $' + (params.length + 1) + "::date + interval '1 day'";
      params.push(dateTo);
    }

    query += ' GROUP BY t.id, u_created.name ORDER BY t.created_at DESC';

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
        u_created.name as created_by_name,
        COALESCE(
          json_agg(
            json_build_object('id', u_assigned.id, 'name', u_assigned.name)
          ) FILTER (WHERE u_assigned.id IS NOT NULL),
          '[]'
        ) as assignees
      FROM tickets t
      LEFT JOIN users u_created ON t.created_by = u_created.id
      LEFT JOIN ticket_assignments ta ON t.id = ta.ticket_id
      LEFT JOIN users u_assigned ON ta.user_id = u_assigned.id
      WHERE t.id = $1
      GROUP BY t.id, u_created.name`,
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
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, category, priority, status, assigned_to } = req.body;

    const ticketResult = await client.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Authorization check
    const isCreator = ticket.created_by === req.userId;
    const isAdmin = req.userRole === 'admin';
    const assigneeCheck = await client.query('SELECT 1 FROM ticket_assignments WHERE ticket_id = $1 AND user_id = $2', [id, req.userId]);
    const isAssignee = assigneeCheck.rows.length > 0;

    if (!isCreator && !isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'You are not authorized to update this ticket' });
    }

    await client.query('BEGIN');

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

    if (updateFields.length > 0) {
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateParams.push(id);
      const updateQuery = `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      await client.query(updateQuery, updateParams);
    }

    // Update assignments
    if (assigned_to !== undefined) {
      await client.query('DELETE FROM ticket_assignments WHERE ticket_id = $1', [id]);
      if (Array.isArray(assigned_to) && assigned_to.length > 0) {
        for (const userId of assigned_to) {
          await client.query(
            'INSERT INTO ticket_assignments (ticket_id, user_id) VALUES ($1, $2)',
            [id, userId]
          );
        }
      }
    }

    await client.query('COMMIT');

    emit(req.app.get('io'), 'tickets', 'updated', { ticket_id: id });

    res.status(200).json({
      message: 'Ticket updated successfully',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
};

const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticketResult = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const ticket = ticketResult.rows[0];

    // Only creator or admin can delete
    if (ticket.created_by !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'You are not authorized to delete this ticket' });
    }

    await pool.query('DELETE FROM tickets WHERE id = $1', [id]);

    emit(req.app.get('io'), 'tickets', 'deleted', { ticket_id: id });

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
    const ticketsResult = await pool.query(`
      SELECT
        COUNT(*)::integer as total_tickets,
        COALESCE(SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END), 0)::integer as open_tickets,
        COALESCE(SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END), 0)::integer as in_progress_tickets,
        COALESCE(SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END), 0)::integer as resolved_tickets,
        COALESCE(SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END), 0)::integer as closed_tickets,
        COALESCE(SUM(CASE WHEN priority = 'Low' THEN 1 ELSE 0 END), 0)::integer as low_priority_tickets,
        COALESCE(SUM(CASE WHEN priority = 'Medium' THEN 1 ELSE 0 END), 0)::integer as medium_priority_tickets,
        COALESCE(SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END), 0)::integer as high_priority_tickets,
        COALESCE(SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END), 0)::integer as critical_priority_tickets
      FROM tickets
    `);

    const usersResult = await pool.query(`
      SELECT COUNT(*)::integer as total_users FROM users WHERE is_active = true
    `);

    const metrics = {
      ...ticketsResult.rows[0],
      total_users: usersResult.rows[0].total_users
    };

    res.status(200).json({
      message: 'Dashboard metrics retrieved successfully',
      metrics,
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
