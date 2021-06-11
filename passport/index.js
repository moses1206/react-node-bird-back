const passport = require('passport');
const { User } = require('../models');
const local = require('./local');

module.exports = () => {
  // req.login(user) 정보가 serializeUser의 user로 들어간다.
  passport.serializeUser((user, done) => {
    // 쿠키와 묶어줄 아이디만 저장한다.
    // done의 첫번째는 서버에러 , 두번째는 성공정보
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      // 쿠키와 묶인 아이디를 받아서 id를 통해 DB에서 유저 정보를 받아온다.
      const user = await User.findOne({ where: { id } });
      done(null, user);
    } catch (error) {
      console.error(error);
      done(error);
    }
  });
  local();
};
