import Elysia from "elysia";
import Database from "../../../utils/db";
import UserModel from "../../../model/user";
import { jwtplugin } from "../../../plugins/jwt";
import { sessionMiddleware } from "../../../plugins/sessionid";
export const LogoutRoute = new Elysia()
  .use(jwtplugin)
  .use(sessionMiddleware)
  .get("/signout", async ({ user, cookie: { token, session }, set }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id);
      usr.sessionid = "";
      await usr.save();
      token.remove();
      session.remove();
      set.status = 200;
      return {
        success: true,
        message: "Successfully signed out"
      };
    } catch (error) {
      console.error(error);
      set.status = 500;
      return {
        success: false,
        message: "Internal Server Error"
      };
    }
  });