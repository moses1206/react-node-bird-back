const express = require('express');
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

// @route   GET    /posts
// @desc    Get All Posts I wrote
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      //   10개만 가져와라
      limit: 10,
      //   생성날짜가 최신의 포스트가 맨위로, 반대는 ASC
      order: [
        ['createdAt', 'DESC'],
        [Comment, 'createdAt', 'DESC'],
      ],
      //   작성자 정보를 추가
      include: [
        {
          model: User,
          //   비밀번호만 빼고 가져온다
          attributes: ['id', 'nickname'],
        },
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              //   코맨트를 작성한 사람의 비밀번호 빼고 가져온다.
              attributes: ['id', 'nickname'],
            },
          ],
        },
      ],
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
