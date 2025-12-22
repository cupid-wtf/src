import Elysia from "elysia";
import { User } from "./me";
import { Bio } from "./bio";
import { UploadAvatar } from "./upload";
import { UploadMusic } from "./music";
import { RefreshKey } from "./refresh";
import { Social } from "./socials";

export const protecteduser = new Elysia()
.use(UploadAvatar)
.use(User)
.use(RefreshKey)
.use(Bio)
.use(UploadMusic)
.use(Social)