// Copyright (C) Konrad Gadzinowski

import { NextFunction, Response } from "express"
import { validationResult } from "express-validator"
import { HydratedDocument } from "mongoose"
import { CollectionSystem } from "../database/CollectionSystem"
import { CollectionUser, UserRole, UserStatus } from "../database/CollectionUser"
import { Role } from "../Role"
import { FlashType, Request } from "../server/Request"
import { CollectionUserSession } from "../database/CollectionUserSession"
import { Network } from "../network/Network"
import passport from "passport"

export class Auth {
  public static SETUP = "AppSetupRun"
  public static SETUP_URL = "/__setup-app__"

  public static configure = () => {
    passport.serializeUser((user, done) => {
      done(null, user._id)
    })

    passport.deserializeUser(async (id, done) => {
      let user = await CollectionUser.findUserById(id)
      done(null, user)
    })
  }

  public static generateRandomToken = (): string => {
    // Generate 6 to 10 random characters 0-9 and A-Z, always uppercase
    let length = Math.floor(Math.random() * 5) + 6
    length = Math.min(length, 10)

    let token = ""
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    for (let i = 0; i < length; i++) {
      let charPosition = Math.floor(Math.random() * characters.length)
      charPosition = Math.min(charPosition, characters.length - 1)
      token += characters.charAt(charPosition)
    }
    return token
  }

  public static doesUserHaveAccess = (user?: HydratedDocument<any>, rolesAllowed?: (Role | UserRole | string)[]) => {
    if (!rolesAllowed || rolesAllowed.length === 0 || rolesAllowed.includes(Auth.SETUP)) return true
    if (!user && rolesAllowed.includes(Role.Guest)) return true
    if (!user) return false
    if (!!user && rolesAllowed.includes(Role.LoggedIn)) return true

    const userRole = user?.role?.toString()
    for (const role of rolesAllowed) {
      if (role.toString() === userRole) return true
    }

    return false
  }

  public static checkUserAuthorization = (rolesAllowed: (Role | UserRole | string)[]) => async (req: Request, res: Response, next: NextFunction) => {
    const user = !!req?.user ? await CollectionUser.findUserById(req.user._id) : undefined

    if (!!rolesAllowed && rolesAllowed.includes(Auth.SETUP)) {
      // Check if setup is still on-going
      const system = await CollectionSystem.get()
      if (system.isSetupFinished) {
        req.flash(FlashType.Warning, "Setup is finished. Restart the app in order to use this route for your own purposes.")
        return res.redirect("/")
      }
    }

    if (!!user && user.status === UserStatus.Banned) {
      req.flash(FlashType.Errors, "Your account was deactivated.")

      user.verificationCodeEmailSentDate = new Date(0) // Allow to log in again instantly
      await user?.save()

      Auth.logout(req)
      return res.redirect("/")
    }

    if (!Auth.doesUserHaveAccess(user, rolesAllowed)) {
      req.flash(FlashType.Errors, "You don't have an access to this page.")
      return res.redirect("/")
    } else {
      return next()
    }
  }

  public static checkSystem = async (req: Request, res: Response, next: NextFunction) => {
    const system = await CollectionSystem.get()
    if (!system.isSetupFinished && req.path !== Auth.SETUP_URL) {
      return res.redirect(Auth.SETUP_URL)
    }
    next()
  }

  public static areParamsValid = (req: Request, res: Response, redirectToOnError: string): boolean => {
    const validationResults = validationResult(req)
    if (!validationResults.isEmpty()) {
      req.flash(
        FlashType.Errors,
        validationResults.array().map((entry) => entry.msg)
      )
      res.redirect(redirectToOnError)
      return false
    }
    return true
  }

  public static logInUser(req: Request, user: HydratedDocument<any>): Promise<HydratedDocument<any>> {
    const self = this
    return new Promise<void>(async (resolve, reject) => {
      req.logIn(user, async (error) => {
        user = !!user ? await CollectionUser.findUserById(user._id) : undefined

        if (user.isBanned()) {
          await self.logout(req)
          return reject("Your account was deactivated. Please contact support for more information.")
        }

        if (error) {
          reject(error)
        } else {
          // Success
          try {
            const userIp = await Network.getUserIp(req)
            await CollectionUserSession.createUserSession(user.id, req.sessionID, userIp, req.headers["user-agent"])
            return resolve(user)
          } catch (error) {
            reject(error)
          }
        }
      })
    })
  }

  public static async logout(req): Promise<any> {
    return new Promise<void>(async (resolve, reject) => {
      if (req.user && req.user._id) {
        await CollectionUserSession.removeUserSession(req.user._id, req.sessionID)

        const user = !!req?.user ? await CollectionUser.findUserById(req.user._id) : undefined
        if (user) {
          user.verificationEmailSentDate = new Date(0) // Allow to log in again instantly
          await user?.save()
        }
      }

      req.logout(() => resolve())
    })
  }

  public static async logoutSessionId(sessionId: string) {
    await CollectionUserSession.removeSession(sessionId)
  }
}
