import Elysia from "elysia";
import { LoginRoute } from "./login";
import { RegisterRoute } from "./register";
import { LogoutRoute } from "./signout";
import { DiscordRoutes } from "./discord";
export const authroutes = new Elysia({
    prefix: "/auth",
  })
.use(LoginRoute)
 .use(RegisterRoute)
.use(LogoutRoute)
.use(DiscordRoutes)
//.use(ForgotRoute)
