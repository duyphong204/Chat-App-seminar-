import { Request, Response, NextFunction } from "express";
import passport from "passport";

/**
 * Middleware xác thực JWT - Tuỳ chọn (Optional)
 * - Nếu có JWT trong cookie → xác thực và gán vào req.user
 * - Nếu không có JWT → cho phép tiếp tục (req.user = null)
 */
export const passportAuthenticateJwtOptional = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Kiểm tra xem có accessToken trong cookie không
  if (!req.cookies?.accessToken) {
    // Không có token, tiếp tục mà không cần xác thực
    return next();
  }

  // Có token, thực hiện xác thực
  passport.authenticate("jwt", { session: false }, (err: any, user: any) => {
    if (err) {
      // Lỗi xác thực, nhưng vẫn cho phép tiếp tục (optional)
      console.log("JWT validation error:", err.message);
      return next();
    }

    if (user) {
      // Xác thực thành công
      req.user = user;
    }

    next();
  })(req, res, next);
};
