const express = require('express');
const { User } = require('../models');
const bcrypt = require('bcrypt');

const router = express.Router();

// @route   POST    /user
// @desc    Sign Up User
// @access  Public
router.post('/', async (req, res, next) => {
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

module.exports = router;
