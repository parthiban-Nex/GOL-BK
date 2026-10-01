import {olddbConfig} from '../config/dbConfig.js';
import { Sequelize } from 'sequelize';
export const oldsequelize = new Sequelize(olddbConfig.DB, olddbConfig.USER, olddbConfig.PASSWORD, {
  host: olddbConfig.HOST,
  dialect: olddbConfig.dialect,
  logging: true,
  timezone: '+05:30',
  pool: {
    max: olddbConfig.pool.max,
    min: olddbConfig.pool.min,
    acquire: olddbConfig.pool.acquire,
    idle: olddbConfig.pool.idle,
  },
});