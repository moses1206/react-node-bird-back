const express = require('express');

const router = express.Router();

// @route   POST    api/post
// @desc    Get logged in user
// @access  Private
router.post('/', (req, res) => {
  res.json({ id: 1, content: 'Hello' });
});

// @route   DELETE    api/post
// @desc    Get logged in user
// @access  Private
router.delete('/', (req, res) => {
  res.json({ id: 1 });
});

module.exports = router;
