const Sequelize = require('sequelize');

// 기본적으로 셋팅은 development이다.
// 기본 PORT는 3306 이다
const env = process.env.NODE_ENV || 'development';

// config안에 3가지 버전중에 development를 가져와라.
const config = require('../config/config.json')[env];

const db = {};

// 시퀄라이즈가 Node 와 Mysql을 연결하게 된다.
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Sequelize에 Model 등록
db.Post = require('./post')(sequelize, Sequelize);
db.User = require('./user')(sequelize, Sequelize);
db.Comment = require('./comment')(sequelize, Sequelize);
db.Image = require('./image')(sequelize, Sequelize);
db.Hashtag = require('./hashtag')(sequelize, Sequelize);

// DB안에 associate(일대일,다대다,일대다 관계)를 실행해준다.
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
