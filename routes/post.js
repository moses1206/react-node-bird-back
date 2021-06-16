const express = require('express');
const { Post, Comment, Image, User } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');

// Upload Images
const multer = require('multer');
const path = require('path');

//Make Images Upload Folder
const fs = require('fs');
try {
  fs.accessSync('uploads');
} catch (error) {
  console.log('uploads 폴더가 없으므로 생성합니다.');
  fs.mkdirSync('uploads');
}

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads');
    },
    filename(req, file, done) {
      // 파일을 올릴때 중복을 막기위해 파일이름에 시간분초까지 넣어서 파일명을 만든다.

      const ext = path.extname(file.originalname); //path를 통해 확장자 추출(.png)
      const basename = path.basename(file.originalname, ext); //파일이름 추출 ( 사자머리)
      done(null, basename + '_' + new Date().getTime() + ext); // 사자머리2106301252.png
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, //20MB
});

// @route   POST    /post
// @desc    Create a Post
// @access  Private
router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    // 이미지가 있다면
    if (req.body.image) {
      // 이미지가 여러개 있다면 Promise.all을 통해 한꺼번에 서버에 기록한다.
      if (Array.isArray(req.body.image)) {
        const images = await Promise.all(
          req.body.image.map((image) => Image.create({ src: image }))
        );
        await post.addImages(images);
      } else {
        // 이미지가 1개만 있다면
        const image = await Image.create({ src: req.body.image });
        await post.addImages(image);
      }
    }

    // 기본적인 post에는 content,UserId만 있으며 여기에
    // Post에 있는 사진과 코멘트 , 유저정보를 붙여준다.
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Image,
        },
      ],
      include: [
        {
          model: User, // 게시글 작성자
          attributes: ['id', 'nickname'],
        },
        {
          model: User, // 좋아요 누른 사람
          as: 'Likers',
          attributes: ['id'],
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
          model: Image,
        },
      ],
    });
    console.log(fullPost);
    res.status(201).json(fullPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   POST    /post/images
// @desc    Upload Images
// @access  private
router.post(
  '/images',
  isLoggedIn,
  // 복수의 이미지 업로드.  upload.single('image') : 1장
  upload.array('image'),
  (req, res, next) => {
    console.log(req.files);
    res.json(req.files.map((v) => v.filename));
  }
);

// @route   DELETE    /post/:postId
// @desc    Delete a Post
// @access  Private
router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  try {
    // 시퀄라이즈에서 삭제할때 사용하는 메소드 destroy
    await Post.destroy({
      // 1. 포스트 아이디가 같고
      where: { id: req.params.postId },
      // 2. 유저 아이디가 내 아이디와 같다
      UserId: req.user.id,
    });
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   POST    /post/`${postId}/comment
// @desc    Create Comment
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

    // 2. Create Comment
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

// @route   PATCH    /post/:postId/like
// @desc    Add Like
// @access  Private
router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
  // PATCH /post/1/like
  try {
    // 1. 포스트가 있는지 검사
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(403).send('게시글이 존재하지 않습니다.');
    }
    // 관계 메소드
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
  try {
    // 1. 포스트가 있는지 검사
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
