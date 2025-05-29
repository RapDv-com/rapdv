import { CollectionUserSession } from "../database/CollectionUserSession"
import { Request } from "./Request"
import { isbot } from 'isbot';

export class Middleware {
  public static useIfNotBot = (logic: (req, res, next) => any) => (req: Request, res, next) => {
    if (req.isBot){
      next()
      return
    }
    logic(req, res, next)
  }

  public static setCookieLifetime = (req: Request, res, next) => {
    // Set session duration based on login state
    const isLoggedIn = !!req.user

    req.session.cookie.maxAge = isLoggedIn
      ? CollectionUserSession.DEFAULT_USER_EXPERIATION_TIME_MS
      : CollectionUserSession.DEFAULT_GUEST_EXPERIATION_TIME_MS // Prevent session overflow

    next()
  }

  public static checkIfItIsBot = (req: Request, res, next) => {
    req.isBot = isbot(req.get("user-agent")) ? true : false
    next()
  }
}