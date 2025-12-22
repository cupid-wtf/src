import Elysia, { t } from "elysia";
import { jwtplugin } from "../../../plugins/jwt";
import { sessionMiddleware } from "../../../plugins/sessionid";
import Database from "../../../utils/db";
import UserModel from "../../../model/user";
import Logger from "../../../utils/logger";

export const Bio = new Elysia()
  .use(jwtplugin)
  .use(sessionMiddleware)
  .get("/bio", async ({ set, user }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id).select("premium config");
      set.status = 200;
      return {
        success: true,
        user: usr,
      };
    } catch (error) {
      set.status = 400;
      return {
        success: false,
        message: "An internal server error has occurred",
      };
    }
  })
  .post(
    "/bio",
    async ({ set, user, body }) => {
      try {
        await Database.init();
        const updatedConfig = {
          "config.bio": body.bio,
          "config.opacity": body.opacity,
          "config.autoplayfix": body.autoplayfix,
          "config.autoplaymessage": body.autoplaymessage,
          "config.font": body.font,
          "config.blur": body.blur,
          "config.width": body.width,
          "config.box_color": body.box_color,
          "config.border_style": body.border_style,
          "config.border_width": body.border_width,
          "config.bg_color": body.bg_color,
          "config.text_color": body.text_color,
          "config.border_color": body.border_color,
          "config.presence": body.presence,
          "config.background_blur": body.background_blur,
          "config.socials": body.socials,
          "config.custom_badges": body.custom_badges,
        };
        const result = await UserModel.findByIdAndUpdate(
          user._id,
          { $set: updatedConfig },
          { new: true },
        );

        if (!result) {
          set.status = 400;
          return {
            success: false,
            message: "User not found",
          };
        }

        set.status = 200;
        return {
          success: true,
          message: "Bio updated successfully",
        };
      } catch (error) {
        set.status = 500;
        return {
          success: false,
          message: "An internal server error has occurred",
        };
      }
    },
    {
      body: t.Object({
        bio: t.String({ minLength: 0, maxLength: 250 }),
        font: t.UnionEnum(["Sora", "Chillax", "Array", "Minecraft"]),
        bg_color: t.String(),
        box_color: t.String(),
        autoplaymessage: t.String({ minLength: 0, maxLength: 100 }),
        text_color: t.String(),
        border_color: t.String(),
        border_style: t.String(),
        autoplayfix: t.Boolean(),
        border_width: t.Numeric(),
        background_blur: t.Numeric(),
        opacity: t.Numeric(),
        presence: t.Boolean(),
        blur: t.Numeric({ minimum: 0, maximum: 100 }),
        width: t.Numeric({ minimum: 400, maximum: 1500 }),
        socials: t.Optional(
          t.Array(
            t.Object({
              platform: t.Optional(t.String()),
              url: t.Optional(t.String()),
            }),
          ),
        ),
        custom_badges: t.Optional(
          t.Array(
            t.Object({
              name: t.String(),
              icon: t.Optional(t.String()),
              enabled: t.Boolean(),
            }),
          ),
        ),
      }),
    },
  );
