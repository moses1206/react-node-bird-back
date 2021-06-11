const passport = require('passport');
const { User } = require('../models');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        // 아이디 로그인이면 email대신에 userId가 들어가게 된다.
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        // 비동기로 서버랑 통신하게 되면 항상 에러가 발생할 수 있으므로
        // Try Catch문으로 에러를 처리해주어야 한다.
        try {
          const user = await User.findOne({
            where: { email },
          });

          // 1. 사용자가 있는지 판단
          if (!user) {
            // 패스포트에서는 응답을 해주지 않는다. done으로 결과만 판단해준다.
            // done(서버에러 , 성공 , 클라이언트 에러)
            return done(null, false, {
              reason: '존재하지 않는 아이디 입니다.!!',
            });
          }
          // 2. 입력된 패스워드와 DB 패스워드(user.password)를 비교한다.
          const result = await bcrypt.compare(password, user.password);
          // 3. result가 참이면 로그인을 성공시키면서 User정보를 담아서 넘겨준다.
          if (result) {
            // true면 서버에러는 null , 프론트에 사용자(user) 정보를 넘겨준다.
            return done(null, user);
          }
          // 4. 비밀번호가 틀렸다면 false , reason을 프론트로 보낸다.
          return done(null, false, { reason: '잘못된 비밀번호 입니다.!!' });
        } catch (error) {
          console.error(error);
          //   서버에러 자리에 error값을 넣어준다.
          return done(error);
        }
      }
    )
  );
};
