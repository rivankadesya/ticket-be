const pool = require('../config/database');
const { emit } = require('../services/socketEmitter');

const addComment = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const { comment } = req.body;
    const user_id = req.userId;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const ticketResult = await pool.query('SELECT id FROM tickets WHERE id = $1', [ticket_id]);
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const result = await pool.query(
      'INSERT INTO ticket_comments (ticket_id, user_id, comment) VALUES ($1, $2, $3) RETURNING *',
      [ticket_id, user_id, comment]
    );

    emit(req.app.get('io'), 'comments', 'added', { ticket_id });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0],
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const result = await pool.query(
      `SELECT tc.*, u.name as user_name FROM ticket_comments tc
       LEFT JOIN users u ON tc.user_id = u.id
       WHERE tc.ticket_id = $1 ORDER BY tc.created_at DESC`,
      [ticket_id]
    );

    res.status(200).json({
      message: 'Comments retrieved successfully',
      count: result.rows.length,
      comments: result.rows,
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { addComment, getComments };
