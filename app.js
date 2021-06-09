// app.get : 가져오기 , app.post : 생성하기,로그인하기
// app.put : 전체수정(통채로 수정) , app.delete : 삭제
// app.patch : 부분수정(닉네임만 수정) , app.patch : 부분수정
// app.option : 찔러보기(서버야 내가 요청보내면 받아줄꺼야?)
// app.head : 헤더만 가져오기

// 하나의 요청에는 하나의 응답만 할 수 있다.

const express = require('express');
const app = express();
const cors = require('cors');

// DB 등록
const db = require('./models');
db.sequelize
  .sync()
  .then(() => {
    console.log('DB 연결 성공');
  })
  .catch(console.error);

// 프론트의 데이터를 req.body 에 넣어주는 역할을 한다.
// 라우터 위에 올려야한다. 위에서 아래로 읽기때문이다.
app.use(express.json()); // 프론트에서 json형태를 req.body 에 넣어준다.
app.use(express.urlencoded({ extended: true })); //form data를 req.body에 넣어준다.
app.use(
  cors({
    origin: true,
    credentials: false,
  })
);

// Import Router
const postRouter = require('./routes/post');
const userRouter = require('./routes/user');

// Use Router
app.use('/post', postRouter);
app.use('/user', userRouter);

app.listen(3065, () => {
  console.log('Sever Start!');
});
