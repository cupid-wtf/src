import Elysia from "elysia";
import { PremiumConfig } from "./config";

export const premiumroutes = new Elysia({prefix: "/premium"})
.use(PremiumConfig)