import { Router } from "express";
import {
  renderHome,
  renderLogin,
  renderRegister,
  renderChat,
} from "../controllers/view.controller";
import { passportAuthenticateJwtOptional } from "../middlewares/passportOptionalAuth.middleware";
import { passportAuthenticateJwt } from "../config/passport.config";

const viewRouter = Router();

// Routes hiển thị trang
viewRouter.get("/", passportAuthenticateJwtOptional, renderHome);
viewRouter.get("/login", renderLogin);
viewRouter.get("/register", renderRegister);
viewRouter.get("/chat", passportAuthenticateJwt, renderChat);

export default viewRouter;
