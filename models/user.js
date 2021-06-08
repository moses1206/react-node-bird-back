// Mysql에서는 table이라고 하고 Sequelize에서는 Model이라고 한다.
// Sequelize가 Mysql에서 엑셀 테이블을 자동으로 만들어준다.

module.exports = (sequelize, DataTypes) => {
  // 모델의 이름은 User인데 Mysql에서는 자동으로 users(소문자,복수)로 바뀐다
  // Sequelize User  ===> Mysql users 로 바뀐다.
  // Type : STRING,TEXT,BOOLEAN,INTEGER,FLOAT,DATETIME
  const User = sequelize.define(
    'User',
    {
      // id:{}  <== Mysql에서 자동으로 만들어준다.만들 필요가 없다.
      //   id가 기본적으로 들어있다 명심할것
      //   email,nickname,password를 column이라고 읽고 엑셀의 세로줄로 생각하면 된다.
      email: {
        //   문자열이어야하며 20글자 이내여야한다.
        type: DataTypes.STRING(30),
        allowNull: false, // False : 필수 , true : 선택
        unique: true, //이메일은 아이디이므로 단1개여만 한다.
      },
      nickname: {
        type: DataTypes.STRING(30),
        allowNull: false, // 필수
      },
      password: {
        //   패스워드는 암호화 되면 길이가 늘어나서 100으로 설정
        type: DataTypes.STRING(100),
        allowNull: false, //필수
      },
    },
    {
      // 한글 저장
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
  User.associate = (db) => {
    // 한사람은 여러개의 Post, Comment 를 가질수 있다.
    // Post , Comment 는 1개의 사람만 가질 수 있다.
    // User 와 Post , Comment 는 일 대 다 관계
    // 한사람이 Post를 여러개 가질 수 있다.
    db.User.hasMany(db.Post);

    // 사용자와 게시글의 좋아요 관계
    // 게시글에 좋아요를 누른 유저가 여러명이 될 수 있고
    // 유저가 여러 게시글에 좋아요를 누를수 있따.
    // belongToMany는 중간 테이블을 형성한다.
    // 중간테이블의 이름은 정해줄수 있다.(Like)
    // 항상 양쪽(Post Model)에 다 중간테이블명(Like)을 넣어주어야 한다.
    // 이름을 안정해주면 UserPost이렇게 이름이 생기는데 가독성이 떨어진다.
    // 내가 좋아요를 누른 게시물을 as Liked(별칭)로 찾아낸다.
    db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked' });

    // 나를 팔로워 한 사람을 찾을려면 팔로잉 아이디중에 내 아이디를 먼저 찾아야한다.
    // 그래서 ForeignKey : followingId 가 내 아이디인 테이블을 찾는다
    // through는 테이블 이름을 바꾸는것이고 ForeignKey는 컬럼의 이름을 바꾸는것이다.
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followers',
      foreignKey: 'FollowingId',
    });

    // 내가 팔로잉하고 있는 사람을 찾을려면 팔로워 아이디중에 내 아이디를 먼저 찾아야한다.
    // 그래서 ForeignKey : followerId 가 내 아이디인 사람을 찾는다.
    db.User.belongsToMany(db.User, {
      through: 'Follow',
      as: 'Followings',
      foreignKey: 'FollowerId',
    });

    // 한사람이 Comment를 여러개 가질 수 있다.
    db.User.hasMany(db.Comment);
  };
  return User;
};
