const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { Op } = require('sequelize');

const { User, Post, Image, Comment } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares.js');

const router = express.Router();

// @route   GET    /user
// @desc    Get single User
// @access  Private
router.get('/', async (req, res, next) => {
  // GET /user
  try {
    if (req.user) {
      const fullUserWithoutPassword = await User.findOne({
        where: { id: req.user.id },
        attributes: {
          exclude: ['password'],
        },
        include: [
          {
            model: Post,
            attributes: ['id'],
          },
          {
            model: User,
            as: 'Followings',
            attributes: ['id'],
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id'],
          },
        ],
      });
      res.status(200).json(fullUserWithoutPassword);
    } else {
      res.status(200).json(null);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.get('/:userId', async (req, res, next) => {
  // GET /user/3
  try {
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.params.userId },
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: Post,
          attributes: ['id'],
        },
        {
          model: User,
          as: 'Followings',
          attributes: ['id'],
        },
        {
          model: User,
          as: 'Followers',
          attributes: ['id'],
        },
      ],
    });
    if (fullUserWithoutPassword) {
      const data = fullUserWithoutPassword.toJSON();
      data.Posts = data.Posts.length;
      data.Followings = data.Followings.length;
      data.Followers = data.Followers.length;
      res.status(200).json(data);
    } else {
      res.status(404).json('존재하지 않는 사용자입니다.');
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   GET    /user/2/posts
// @desc    조회한 유저의 포스트 가져오기
// @access  Private
router.get('/:userId/posts', async (req, res, next) => {
  try {
    const where = { UserId: req.params.userId };
    // 쿼리스트링을 받는 방법 , 초기로딩이 아닐때
    if (parseInt(req.query.lastId, 10)) {
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

// @route   POST    /user/login
// @desc    Login User
// @access  Public
// 패스포트 전략 적용을 위해 passport.authenticate('local')을 사용
// 패스포트에서 (서버에러,로그인정보,클라이언트에러) 정보가 라우터에
// (err,user,info)로 전달된다.
// passport를 사용할 수 있게 미들웨어 확장을 이용한다.
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    // 서버에러가 발생한다면
    if (err) {
      console.error(err);
      return next(err);
    }
    // 클라이언트 에러 (입력된 아이디 비밀번호 오류)
    // 클라이언트에 info.reason으로 메시지를 전달한다.
    // 401 인증에 실패함.
    if (info) {
      return res.status(401).send(info.reason);
    }

    // 성공하게 되면 패스포트 로그인을 시도한다.
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }

      // 비밀번호는 없애고 Followings,Followers를 더하는 유저
      // 객체를 생성한다.
      const fullUserWithoutPassword = await User.findOne({
        // 유저를 찾고
        where: { id: user.id },
        // 패스워드만 빼고 가져오겠다.
        attributes: {
          exclude: ['password'],
        },

        // Followings,Followers 정보를 Model associate를 통해
        // 정보를 추가하겠다.
        include: [
          {
            model: Post,
            attributes: ['id'],
          },
          {
            model: User,
            as: 'Followings',
            attributes: ['id'],
          },
          {
            model: User,
            as: 'Followers',
            attributes: ['id'],
          },
        ],
      });

      // 사용자 정보를 프론트로 넘겨준다.
      return res.status(200).json(fullUserWithoutPassword); // action.data로 가서 reducer에서 me가 된다.
    });
  })(req, res, next);
});

// @route   POST    /user
// @desc    Sign Up User
// @access  Public
router.post('/', isNotLoggedIn, async (req, res, next) => {
  // await 붙으면 try catch 구문을 통해 에러를 잡아주어야 한다.
  try {
    // 먼저 서버에서 이메일 중복이 있는지 검사한다.
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (exUser) {
      // return 을 붙이지 않으면 응답이 2번되는 에러가 발생한다.1번요청 1번응답
      // 꼭 return 을 붙여서 라우터를 종료해줘야한다.
      // return을 넣지않으면 can't set headers already sent 에러메시지 발생
      // 클라이언트에서 잘못된 정보를 입력했기때문에 400번 에러를 돌려준다.
      return res.status(403).send('이미 사용중인 아이디 입니다.');
    }

    const hashPassword = await bcrypt.hash(req.body.password, 12); //10~13 사용하는데 높을수록 얌호화가 높다.
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashPassword,
    });

    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3060');
    res.status(201).send('회원가입이 완료되었습니다.!!');
  } catch (error) {
    console.error(error);
    // 넥스트를 통해서 에러를 처리하면 한방에 처리된다.
    next(error); //500
  }
});

// @route   POST    /user/logout
// @desc    Log Out User
// @access  private
router.post('/logout', isLoggedIn, (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('로그아웃 되었습니다!!');
});

// @route   PETCH    /user/nickname
// @desc    Petch my nickname
// @access  private
router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    // 시퀄라이즈에서 수정할때 update 메소드를 쓴다.
    await User.update(
      {
        //내 아이디의 닉네임을 프론트에서 받은 닉네임으로 수정
        nickname: req.body.nickname,
      },
      {
        where: { id: req.user.id },
      }
    );
    res.status(200).json({ nickname: req.body.nickname });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   PETCH    /user/1/follow
// @desc    1번 유저 팔로우
// @access  private
router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 유저가 존재하는지 확인한다.
    const user = await User.findOne({ where: { id: req.params.userId } });

    if (!user) {
      res.status(403).send('팔로우할 대상이 존재하지 않습니다..!!');
    }

    // 2. 데이터베이스에서 내가 팔로우할려는 아이디의 followers에 내 아이디를 추가한다.
    // 내가 팔로우 버튼을 누르면 내가 팔로워가 된다.
    await user.addFollowers(req.user.id);

    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   DELETE    /user/1/follow
// @desc    1번유저 언팔로우
// @access  private
router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 유저가 존재하는지 확인한다.
    const user = await User.findOne({ where: { id: req.params.userId } });

    if (!user) {
      res.status(403).send('언팔로우할 대상이 존재하지 않습니다..!!');
    }

    // 2. 내가 팔로우할려는 아이디의 followers에 내 아이디를 삭제한다.
    // 유저의 팔로우 아이디에 내 아이디를 삭제.
    await user.removeFollowers(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   DELETE    /user/1/follow
// @desc    나를 팔로우한 사람을 내가 제거하기
// @access  private
router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 유저를 찾는다
    const user = await User.findOne({ where: { id: req.params.userId } });

    if (!user) {
      res.status(403).send('대상이 존재하지 않습니다.!!');
    }
    // 2. 유저의 팔로잉즈에 내 아이디를 제거한다.
    await user.removeFollowings(req.user.id);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   GET    /user/followers
// @desc    Get My followers(나를 팔로우 한 사람)
// @access  private
router.get('/followers', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 나를 먼저 찾는다.
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      res.status(403).send('팔로워를 찾을 수 없습니다.!!');
    }

    // 2. 데이터베이스에서 나를 팔로우한 사람을 가져온다.
    const followers = await user.getFollowers();
    res.status(200).json(followers);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   GET    /user/2/followings
// @desc    Get My followings(내가 팔로잉한 사람)
// @access  private
router.get('/followings', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 나를 먼저 찾는다.
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      res.status(403).send('팔로잉을 찾을 수 없습니다.!!');
    }

    // 2. 데이터베이스에서 내가 팔로우 한 사람을 가져온다.
    const followings = await user.getFollowings();
    res.status(200).json(followings);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// @route   DELETE    /user/follower/:userid
// @desc    Delete my follower(나를 팔로잉 한 사람을 제거)
// @access  private
router.delete('/follower/:userid', isLoggedIn, async (req, res, next) => {
  try {
    // 1. 나를 먼저 찾는다.
    const user = await User.findOne({ where: { id: req.user.id } });

    if (!user) {
      res.status(403).send('차단할려는 사람을 찾을 수 없습니다.!!');
    }

    // 2. 데이터베이스에서 내가 팔로우 한 사람을 가져온다.
    await user.removeFollowers(req.params.userId);
    res.status(200).json({ UserId: parseInt(req.params.userId, 10) });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
