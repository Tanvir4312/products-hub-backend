/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application, Request, Response } from "express";
import { IndexRoutes } from "./app/route";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import cookieParser from "cookie-parser";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/lib/auth";
import path from "path";
import { envVars } from "./app/config/env";
import cors from "cors";
import { notFound } from "./app/middlewares/notFound";
import { requestLogger } from "./app/middlewares/requestLogger";
import rateLimit from "express-rate-limit";




const app: Application = express();

app.set("view engine", "ejs");
app.set("views", path.resolve(process.cwd(), `src/app/templates`));



// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL as string,

//     credentials: true,
//   }),
// );

app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL as string,
      envVars.BETTER_AUTH_URL as string,
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Stricter rate limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
});

// Global rate limiter for non-auth routes
const globalLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path.startsWith("/api/auth"),
});

// Apply stricter rate limit on auth routes
app.use("/api/auth", authLimiter, toNodeHandler(auth));

// Apply global rate limiter
app.use(globalLimiter);
// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

// Request logging middleware
app.use(requestLogger);

app.use("/api/v1", IndexRoutes);

// Global error handler
app.use(notFound);
app.use(globalErrorHandler);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

export default app;
