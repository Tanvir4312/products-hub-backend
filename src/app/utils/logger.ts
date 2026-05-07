import winston from "winston";
import { envVars } from "../config/env";
import path from "path";

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

// Add file transport in production
if (envVars.NODE_ENV === "production") {
    transports.push(
        new winston.transports.File({
            filename: path.join(process.cwd(), "logs", "error.log"),
            level: "error",
            format: logFormat,
        }),
        new winston.transports.File({
            filename: path.join(process.cwd(), "logs", "app.log"),
            format: logFormat,
        })
    );
}

export const logger = winston.createLogger({
    level: envVars.NODE_ENV === "development" ? "debug" : "info",
    defaultMeta: { service: "products-hub-backend" },
    transports,
    exitOnError: false,
});

export default logger;
