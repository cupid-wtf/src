import Elysia, { t } from "elysia"
import { jwtplugin } from "../../../plugins/jwt";
import crypto from "crypto";
import { sessionMiddleware } from "../../../plugins/sessionid";
import Database from "../../../utils/db";
import UserModel from "../../../model/user";
import Logger from "../../../utils/logger";
export const RefreshKey = new Elysia()
  .use(jwtplugin)
  .use(sessionMiddleware)
  .put("/refresh", async ({ set, user }) => {
    try {
      await Database.init();
      const apihash = crypto.randomBytes(25).toString('hex');
      await UserModel.findByIdAndUpdate(user._id, {
        "api_key": apihash
      })
      set.status = 200;
        return {
          success: true,
          message: "API key refreshed successfully",
          key: apihash,
        };
    } catch (error) {
        set.status = 400
        return {
            success: false,
            message: "An internal server error has occurred"
        }
    }
})