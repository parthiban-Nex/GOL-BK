import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf } = format;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Specify the absolute path for the log directory
const logDirectory = '../../logs';

// Ensure the logs directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: 'info', // Set the minimum log level
  format: timestamp(),
  transports: [
    new transports.Console({
      format: combine(
        timestamp(),
        format.colorize(), // Colorize the output for the console
        logFormat
      ),
    }), // Log to console
    new DailyRotateFile({
      filename: path.join(logDirectory, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: combine(timestamp(), logFormat),
    }), // Log to a file in the specified directory with daily rotation
  ],
});

export default logger;
