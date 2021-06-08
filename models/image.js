module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define(
    'Image',
    {
      src: {
        type: DataTypes.STRING(200),
        allowNull: false, // 필수
      },
    },
    {
      // 이미지는 이모티콘이 필요없어서 mb4삭제
      charset: 'utf8',
      collate: 'utf8_general_ci',
    }
  );
  Image.associate = (db) => {
    // Image는 1명의 Post에 속해있다.
    db.Image.belongsTo(db.Post);
  };
  return Image;
};
