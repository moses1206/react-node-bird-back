// Mysql에서는 table이라고 하고 Sequelize에서는 Model이라고 한다.
// Sequelize가 Mysql에서 엑셀 테이블을 자동으로 만들어준다.

module.exports = (sequelize, DataTypes) => {
  // 모델의 이름은 Post인데 Mysql에서는 자동으로 posts(소문자,복수)로 바뀐다
  // Sequelize User  ===> Mysql posts 로 바뀐다.
  const Post = sequelize.define(
    'Post',
    {
      // id:{}  <== Mysql에서 자동으로 만들어준다.만들 필요가 없다.
      //   id가 기본적으로 들어있다 명심할것
      content: {
        type: DataTypes.TEXT,
        allowNull: false, // 필수
      },
      // RetwweetId:
    },
    {
      // 한글,이모티콘 저장
      // 이모티콘을 사용하기 위해서는 mb4를 붙여준다.
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  Post.associate = (db) => {
    // Post는 1명의 유저에게 속해있다.
    // 포스트의 작성자
    db.Post.belongsTo(db.User);

    // 사용자와 게시글의 좋아요 관계
    // 게시글에 좋아요를 누른 유저가 여러명이 될 수 있고
    // 유저가 여러 게시글에 좋아요를 누를수 있따.
    // 항상 양쪽에 다 중간테이블명(Like)을 넣어주어야 한다.
    // 포스트에 좋아요를 누른사람을 별칭(Likers)로 찾아낸다.
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers' });

    // 1개의 Post에 여러개의 Comment가 있다
    db.Post.hasMany(db.Comment);

    // 1개의 Post에 여러개의 Image가 있다.
    db.Post.hasMany(db.Image);

    // 1개의 해시태그안에 여러개의 Post가 있다.
    // 1개의 Post안에 여러개의 해시태그가 있다.
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });

    // 리트윗
    // 어떤 게시글은 다른 게시글의 리트윗 일 수 있다.
    // Post안에 RetweetId 의 이름을 가진 컬럼을 만들고 싶다면.
    db.Post.belongsTo(db.Post, { as: 'Retweet' });
  };
  return Post;
};
