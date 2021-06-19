const express = require('express');
const { Post, Comment, Image, User, Hashtag } = require('../models');
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
    // 헤시태그 정규 표현식
    const hashtags = req.body.content.match(/#[^\s#]+/g);
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id,
    });

    if (hashtags) {
      const result = await Promise.all(
        hashtags.map((hashtag) =>
          // 입력받은 해시태그에 앞에 #을 때고 대문자도 소문자로 바꾸어  데이터베이스에 입력하여
          // 검색시 해시태그가 검색되도록 설계한다.
          // 중복등록을 막기위해 FindOrCreate : 있으면 무시하고 없으면 생성한다.
          Hashtag.findOrCreate({
            where: { name: hashtag.slice(1).toLowerCase() },
          })
        )
      );
      // result = [[노드,true],[리액트,true]] v[0]을 통해 true는 버리고 앞에것만 등록한다.
      await post.addHashtags(result.map((v) => v[0]));
    }

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
      where: { id: req.params.postId, UserId: req.user.id },
      // 2. 유저 아이디가 내 아이디와 같다
    });
    res.status(200).json({ PostId: parseInt(req.params.postId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   GET    /post/:postId
// @desc    Get single Post
// @access  Private
router.get('/:postId', async (req, res, next) => {
  // GET /post/1
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    });
    if (!post) {
      return res.status(404).send('존재하지 않는 게시글입니다.');
    }
    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [
        {
          model: Post,
          as: 'Retweet',
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
        {
          model: User,
          attributes: ['id', 'nickname'],
        },
        {
          model: User,
          as: 'Likers',
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
              attributes: ['id', 'nickname'],
            },
          ],
        },
        {
          model: User, // 좋아요 누른 사람
          as: 'Likers',
          attributes: ['id', 'nickname'],
        },
      ],
    });
    res.status(200).json(fullPost);
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

// @route   POST    /post/`${postId}/retweet
// @desc    Create Retweet
// @access  Private
router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 포스트가 있는지 검사
    const post = await Post.findOne({
      where: { id: req.params.postId },
      // include "Retweet" 하면 post.Retweet 만들어진다.
      include: [
        {
          model: Post,
          as: 'Retweet',
        },
      ],
    });

    if (!post) {
      return res.status(403).send('존재하지 않는 게시글입니다.!!');
    }

    if (
      // 자기 자신의 글을 리트윗을 하거나
      req.user.id === post.UserId ||
      // 내 글을 다른사람이 리트윗한것을 다시 내가 리트윗하는것은 막겠다.
      (post.Retweet && post.Retweet.UserId === req.user.id)
    ) {
      return res.status(403).send('자신의 글은 리트윗할 수 없습니다.');
    }

    // 리트윗 아이디가 있다면 리트윗 아이디를 사용하고 아니면 포스트 아이디를 사용한다.
    const retweetTargetId = post.RetweetId || post.id;

    // 이미 리트윗한 것은 리트윗할 수 없습니다.
    const exPost = await Post.findOne({
      where: {
        UserId: req.user.id,
        RetweetId: retweetTargetId,
      },
    });
    if (exPost) {
      return res.status(403).send('이미 리트윗했습니다!!');
    }

    const retweet = await Post.create({
      UserId: req.user.id,
      RetweetId: retweetTargetId,
      content: 'retweet',
    });

    // 내가 어떤 게시글을 리트윗했는지 만들어준다.
    const retweetWithPrevPost = await Post.findOne({
      // 리트윗된 포스트를 찾는다.
      where: { id: retweet.id },
      // 리트윗 포스트의 Retweet,User,Image,Comment,Likers등을 넣어준다.
      include: [
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
        {
          model: User,
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
              attributes: ['id', 'nickname'],
            },
          ],
        },
        {
          // 좋아요 누른 목록
          model: User,
          as: 'Likers',
          attributes: ['id'],
        },
      ],
    });

    res.status(201).json(retweetWithPrevPost);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
