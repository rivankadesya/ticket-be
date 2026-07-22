const express = require('express');
const router = express.Router();
const { addComment, getComments } = require('../controllers/commentController');
const { verifyToken } = require('../middleware/auth');

router.post('/:ticket_id/comments', verifyToken, addComment);
router.get('/:ticket_id/comments', verifyToken, getComments);

module.exports = router;
