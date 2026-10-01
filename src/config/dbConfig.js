import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appEnv = process.env.APP_ENV || 'local';

let envFile = '.env.local';

if (appEnv === 'uat') {
  envFile = '.env.uat';
} else if (appEnv === 'production') {
  envFile = '.env.production';
}

const result = dotenv.config({
  path: path.resolve(__dirname, '../../', envFile),
  override: true,
});

// console.log('dotenv result:', result);
// console.log(`Using environment file: ${envFile}`);
// console.log(`DB_HOST: ${process.env.DB_HOST}`);
// console.log(`DB_USER: ${process.env.DB_USER}`);
// console.log(`DB_PASSWORD loaded: ${process.env.DB_PASSWORD ? 'YES' : 'NO'}`);
// console.log(`DB_NAME: ${process.env.DB_NAME}`);

export const dbConfig = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: process.env.DB_NAME,
  dialect: process.env.DB_DIALECT || 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

export const olddbConfig = {
  HOST: process.env.DB_HOST,
  USER: process.env.DB_USER,
  PASSWORD: process.env.DB_PASSWORD || '',
  DB: "old_dms_pv",
  dialect: process.env.DB_DIALECT || 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};




