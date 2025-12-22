import { Elysia, t, redirect } from "elysia";
import { authroutes } from "./routes/auth/mod";
import fs from "fs";
import path from "path";
import { protecteduser } from "./routes/user/mod";
import Logger from "../utils/logger";
import Config from "../utils/config";
import Database from "../utils/db";
import { cors } from "@elysiajs/cors";
import UserModel from "../model/user";
import s3 from "../utils/s3";
import { premiumroutes } from "./routes/premium/mod";

// Config
await Config.load('config.toml');
Logger.log(`Loaded ${Object.keys(Config.get()).length} item(s) into the config!`);

// Database
if (!await Database.init()) {
  Logger.error("Unable to connect to the Mongodb database - please check credentials!");
  process.exit(0);
}
Logger.log("Successfully connected to Mongodb!");

// S3
if (!await s3.init()) {
  Logger.error("Unable to connect to the S3 - please check credentials!");
  process.exit(0);
}
Logger.log("Successfully connected to S3!");

const APP_PORT = Config.get<number>("app", "port");
const app = new Elysia()
  .use(cors({
    origin: ['opium.bio', 'localhost'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }))
  .group("/v1", (app) =>
    app
      .use(authroutes)
      .use(protecteduser)
      .use(premiumroutes)
      .get('/users', async () => {
        const users = await UserModel.find({
            $and: [
                { 'config.avatar': { $ne: null } },
                { 'config.avatar': { $ne: '' } },
            ]
        }, 'username url config.avatar');
        return { success: true, users };
    })     
  ) 
   .post("/verify", async ({ body, set }) => {
    await Database.init();
    try {
        const { token } = body;
        
        if (typeof token !== "string" || !token.trim()) {
            set.status = 400;
            return {
                message: 'Invalid input',
                issues: [{ message: 'Token must be a non-empty string' }],
            };
        }

        const user = await UserModel.findOne({
            emailVerificationtoken: token,
            emailVerified: false
        }).select('emailVerificationtoken emailVerified');

        if (!user) {
            set.status = 401;
            return { message: 'Invalid or expired verification token' };
        }

        user.emailVerified = true;
        user.emailVerificationtoken = null;
        await user.save();

        set.status = 200;
        return {
            message: 'Email verified successfully',
            verified: true
        };
    } catch (error) {
        set.status = 500;
        return {
            message: 'Something went wrong',
        };
    }
  }, {
    body: t.Object({
        token: t.String()
    })
  })
  .group("/etc", (app) =>
    app
      .get("/quotes", async () => {
        try {
          const quotesFilePath = path.join(__dirname, '../quotes.txt');
          const quotes = fs.readFileSync(quotesFilePath, 'utf8').split('\n').map(quote => quote.trim());
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          return {
            success: true,
            message: randomQuote
          };
        } catch (error) {
          return {
            success: false,
            message: "Unable to load quotes"
          };
        }
      })
      .get('/discord', () => {
        return redirect("");
      })
  )
  .post('/verify/:code', async ({ params }) => {
    try {
      const user = await UserModel.findOne({
        emailVerificationtoken: params.code,
        emailVerified: false
      });

      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired verification token'
        };
      }

      user.emailVerified = true;
      user.emailVerificationtoken = null;
      await user.save();  

      return {
        success: true,  
        message: 'Email verified successfully',
      };
    } catch {
      return {
        success: false,
        message: "An internal server error has occurred"
      };
    }
  }, {
    params: t.Object({
      code: t.String()
    })
  })
  .use(cors({
    origin: ['opium.bio', 'localhost'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }))
  .listen(APP_PORT);

Logger.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
