const express = require('express');
const { Op } = require('sequelize');

const { Post, Image, User, Comment } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
  // GET /posts
  try {
    const where = {};
    // 쿼리스트링을 받는 방법 , 초기로딩이 아닐때
    if (parseInt(req.query.lastId, 10)) {
      // 초기 로딩이 아닐 때
      // 아이디가 lastId보다 작은수
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) };
    } // 21 20 19 18 17 16 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1
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
      include: [
        //   작성자 정보를 추가
        {
          model: User,
          //   비밀번호만 빼고 가져온다
          attributes: ['id', 'nickname'],
        },
        {
          model: Image,
        },
        {
          // 코멘트 단 사람
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['id', 'nickname'],
            },
          ],
        },
        {
          model: User, // 좋아요 누른 사람
          as: 'Likers',
          attributes: ['id'],
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
            {
              model: Image,
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
