// Mysql에서는 table이라고 하고 Sequelize에서는 Model이라고 한다.
// Sequelize가 Mysql에서 엑셀 테이블을 자동으로 만들어준다.

module.exports = (sequelize, DataTypes) => {
  // 모델의 이름은 Comment인데 Mysql에서는 자동으로 comments(소문자,복수)로 바뀐다
  // Sequelize Comment  ===> Mysql comments 로 바뀐다.
  const Comment = sequelize.define(
    'Comment',
    {
      // id:{}  <== Mysql에서 자동으로 만들어준다.만들 필요가 없다.
      //   id가 기본적으로 들어있다 명심할것
      content: {
        type: DataTypes.TEXT,
        allowNull: false, // 필수
      },
      // belongsTo로 설정하면 id 테이블이 생긴다.
      // 1개의 댓글에 1개의 유저 1개의 포스트가 가능함
      // UserId:{}, <== 어떤 사용자가 작성한 댓글이다
      // PostId:{}, <== 어떤 포스트에 작성된 댓들이다.
    },
    {
      // 한글,이모티콘 저장
      // 이모티콘을 사용하기 위해서는 mb4를 붙여준다.
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  Comment.associate = (db) => {
    db.Comment.belongsTo(db.User); // belongsTo로 인하여UserId 컬럼이 생긴다
    db.Comment.belongsTo(db.Post); // belongsTo로 인하여PostId 컬럼이 생긴다
  };
  return Comment;
};
