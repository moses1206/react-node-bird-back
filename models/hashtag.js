module.exports = (sequelize, DataTypes) => {
  const Hashtag = sequelize.define(
    'Hashtag',
    {
      name: {
        type: DataTypes.STRING(20),
        allowNull: false, // 필수
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
  Hashtag.associate = (db) => {
    // 1개의 헤시태그안에 여러 개시글이 있다
    // 1개의 개시글에도 여러개의 해시태그가 있다.
    // 중간테이블 이름 through를 통해 PostHashtag 라고 명명
    db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
  };
  return Hashtag;
};
