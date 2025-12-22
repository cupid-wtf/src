import Elysia, { t } from "elysia"
import { jwtplugin } from "../../../plugins/jwt";
import { sessionMiddleware } from "../../../plugins/sessionid";
import Database from "../../../utils/db";
import UserModel from "../../../model/user";
import Logger from "../../../utils/logger";
import InvitesModel from "../../../model/invites";
export const User = new Elysia()
  .use(jwtplugin)
  .use(sessionMiddleware)
  .get("/@me", async ({ set, user }) => {
    try {
      await Database.init();
      const usr = await UserModel.findById(user._id).select("username url premium api_key ips sessionid admin invite_creds discord owner email id uid views registrationDate")
      const userInvites = await InvitesModel.find({ addedby: user._id.toString() });
      const usedInvites = await InvitesModel.find({ addedby: user._id.toString() }).select("key createdon expireson usedon status usedby");
      const usedInviteIds = usedInvites
        .filter(invite => invite.usedby)
        .map(invite => invite.usedby);
      const usedInviteUsers = usedInviteIds.length > 0 ? 
        await UserModel.find({ _id: { $in: usedInviteIds } })
        .select("username url config.avatar registrationDate") : [];
      
      set.status = 200;
      return {
          success: true,
          user: {
              username: usr.username,
              url: usr.url,
              email: usr.email,
              uid: usr.uid,
              views: usr.views,
              registrationDate: usr.registrationDate,
              admin: usr.admin,
              invite_creds: usr.invite_creds,
              discord: usr.discord,
              owner: usr.owner,
              api_key: usr.api_key,
              ips: usr.ips,
              sessionid: usr.sessionid,
              premium: usr.premium,
              invites: userInvites,
              usedinvites: usedInviteUsers,
          },
      }
    } catch (error) {
        Logger.error(`Error in /@me GET route: ${error}`);
        set.status = 400
        return {
            success: false,
            message: "An internal server error has occurred"
        }
    }
})
.post("/@me", async ({set, user, body}) => {
    try {
        await Database.init();
        const reservedWords = [
            'api', 'login', 'register', 'auth', 'legal', 'admin', 'dash'
        ];
        if (reservedWords.includes(body.url.toLowerCase())) {
            set.status = 400;
            return {
                success: false,
                message: `The URL "${body.url}" is not allowed.`
            };
        }
        const existingUser = await UserModel.findOne({
            $and: [
                { _id: { $ne: user._id } },
                {
                    $or: [
                        { username: body.username },
                        { url: body.url },
                        { email: body.email }
                    ]
                }
            ]
        });
        
        if (existingUser) {
            let conflictField = "";
            if (existingUser.username === body.username) conflictField = "Username";
            else if (existingUser.url === body.url) conflictField = "URL";
            else if (existingUser.email === body.email) conflictField = "Email";
            set.status = 409; 
            return {
                success: false,
                message: `${conflictField} is already in use by another account.`
            };
        }
        await UserModel.findByIdAndUpdate(user._id, {
            username: body.username,
            url: body.url,
            email: body.email,
        });
        
        set.status = 200;
        return {
            success: true,
            message: "Account updated successfully."
        };
    } catch (error) {
        Logger.error(`Error in /@me POST route: ${error}`);
        set.status = 400;
        return {
            success: false,
            message: "An internal server error has occurred"
        };
    }
}, {
  body: t.Object({
    username: t.String({
      minLength: 1,
      maxLength: 64,
      pattern: "^[a-zA-Z0-9_-]+$"
    }),
    url: t.String({
      minLength: 1,
      maxLength: 40,
      pattern: "^[a-zA-Z0-9_-]+$" 
    }),
    email: t.String({ minLength: 0, format: 'email' }),
  })
});