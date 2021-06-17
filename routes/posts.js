const express = require('express');
const { Op } = require('sequelize');
const { Post, User, Image, Comment } = require('../models');

const router = express.Router();

// @route   GET    /posts
// @desc    Get All Posts I wrote
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const where = {}; //초기로딩일때

    // 쿼리스트링을 받는 방법 , 초기로딩이 아닐때
    // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
    if (parseInt(req.query.lastId, 10)) {
      // 아이디가 lastId보다 작은수
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) }; // 보다 작은수
    }

    const posts = await Post.findAll({
      // where 안에 lastId보다 작은거라는 의미가 있따.
      where,
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

        // 좋아요 누른사람.
        {
          model: User,
          as: 'Likers',
          attributes: ['id'],
        },
        // 코멘트 단 사람
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
        {
          model: Image,
        },
        {
          model: Post,
          as: 'Retweet',
          // 리트윗 게시글의 작성자와 이미지를 가져온다.
          include: [
            {
              model: User,
              attributes: ['id', 'nickname'],
            },
            { model: Image },
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
