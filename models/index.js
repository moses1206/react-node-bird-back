const Sequelize = require('requelize');

// 기본적으로 셋팅은 development이다.
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

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
