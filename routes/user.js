const express = require('express');
import { User } from '../models';

const router = express.Router();

// @route   POST    /user
// @desc    Sign Up User
// @access  Public
router.post('/', async (req, res) => {
  await User.create({
    email: req.body.email,
    nickname: req.body.nickname,
    password: req.body.password,
  });

  res.json(res.response);
});

module.exports = router;
