const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');

const { User, Post } = require('../models');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares.js');

const router = express.Router();

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

module.exports = router;
