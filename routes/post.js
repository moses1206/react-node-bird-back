const express = require('express');
const { Post, Comment, Image, User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

const router = express.Router();

// @route   POST    /post
// @desc    Get logged in user
// @access  Private
router.post('/', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    // 기본적인 post에는 content,UserId만 있으며 여기에
    // Post에 있는 사진과 코멘트 , 유저정보를 붙여준다.
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image,
        },
        {
          model: Comment,
          include: [
            {
              model: User, // 댓글 작성자
              attributes: ['id', 'nickname'],
            },
          ],
        },
        {
          model: User, // 게시글 작성자
          attributes: ['id', 'nickname'],
        },
        {
          model: User, // 좋아요 누른 사람
          as: 'Likers',
          attributes: ['id'],
        },
      ],
    });

    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   POST    /post/`${postId}/comment
// @desc    Get logged in user
// @access  Private
// 동적 주소를 만들기위해 parameter를 사용한다.(/:postId)
router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 포스트가 있는지 검사
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });

    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.!!');
    }

    // 2. Create Post
    const comment = await Comment.create({
      content: req.body.content,
      // PostId는 주소창의 params를 통해 가져온다.
      PostId: parseInt(req.params.postId, 10),
      UserId: req.user.id,
    });

    const fullComment = await Comment.findOne({
      where: { id: comment.id },
      include: [
        {
          model: User,
          attributes: ['id', 'nickname'],
        },
      ],
    });

    res.status(201).json(fullComment);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   DELETE    api/post
// @desc    Get logged in user
// @access  Private
router.delete('/', isLoggedIn, (req, res) => {
  res.json({ id: 1 });
});

// @route   PATCH    /post/:postId/like
// @desc    Add Like
// @access  Private
router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
  // PATCH /post/1/like
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.addLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   DELETE    /post/:postId/like
// @desc    Delete Like
// @access  Private
router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
  // DELETE /post/1/like
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    await post.removeLikers(req.user.id);
    res.json({ PostId: post.id, UserId: req.user.id });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
