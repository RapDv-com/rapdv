// Copyright (C) Konrad Gadzinowski

import { CollectionUser, UserRole, UserStatus } from "../database/CollectionUser"
import { Request } from "../server/Request"
import { HydratedDocument } from "mongoose"
import { Collection } from "../database/Collection"
import { CheckEmail, EmailExistance } from "../mailer/CheckEmail";
import { Auth } from "./Auth"
import { Mailer } from "../mailer/Mailer";
import { AppBasicInfo } from "../RapDvApp";

export class AuthEmailCodes {

  private static CHECK_EMAIL_EXISTANCE_ON_ACCOUNT_CREATION = process.env.CHECK_EMAIL_EXISTANCE_ON_ACCOUNT_CREATION === "true"

  private static TOKEN_MAX_AGE_MS = 3 * 60 * 60 * 1000 // 3h
  private static BANNED_EMAILS: string[] = ["test.com", "test.net"]

  // No need to configure

  private static isEmailBanned(email) {
    if (!email) return true

    const [emailName, emailDomain] = email.split("@")
    if (!emailDomain) return true

    for (let emailBanned of AuthEmailCodes.BANNED_EMAILS) {
      if (emailDomain.indexOf(emailBanned) >= 0) return true
    }

    // Check user defined banned domains
    const customBannedDomainsText = process.env.BANNED_EMAIL_DOMAINS
    if (!!customBannedDomainsText) {
      const customBannedDomains = customBannedDomainsText.split(",").filter((value) => !!value && value.trim().length > 0)
      for (let emailBanned of customBannedDomains) {
        if (emailDomain.indexOf(emailBanned) >= 0) return true
      }
    }

    return false
  }

  public static async initLogIn(
    req: Request,
    email: string,
    appBasicInfo: AppBasicInfo,
    mailer: Mailer,
    firstName?: string,
    lastName?: string,
    role?: UserRole | string
  ): Promise<HydratedDocument<any>> {
    const self = this
    return new Promise<void>(async (resolve, reject) => {
      if (AuthEmailCodes.isEmailBanned(email)) {
        return reject("We can't accept this email address.")
      }

      // Create user
      let user = await CollectionUser.findUserByEmail(email)
      if (!user) {

        if (AuthEmailCodes.CHECK_EMAIL_EXISTANCE_ON_ACCOUNT_CREATION) {
          try {
            const emailExistance = await CheckEmail.doesEmailExist(email)
            if (emailExistance === EmailExistance.DoesntExist) {
              throw new Error("We couldn't verify the existance of your email. Please log in with Google or contact us.")
            }
          } catch (error) {
            console.warn("Couldn't check email existance: ", email, " Error: ", error)
          }
        }

        user = await CollectionUser.createUserForAuthEmailCodes(email, false, firstName ?? "", lastName ?? "", role ?? UserRole.User, UserStatus.Live, "")
        user = await CollectionUser.findUserById(user._id)
      }

      try {
        await AuthEmailCodes.sendVerificationEmail(user, appBasicInfo, mailer)
      } catch (error) {
        if (error) return reject(error)
      }
      resolve(user)
    })
  }

  public static verifyEmail = async (req: Request, email: string, code: string): Promise<void> => {

    const collectionUser = Collection.get("User") as CollectionUser
    try {
      const specifiedUser = await collectionUser.findOne({ email })

      const MAX_FAILED_ATTEMPTS = 10
      const FAILED_WAIT_TIME_MS = 15 * 60 * 1000
      if (specifiedUser.failedLoginAttempts >= MAX_FAILED_ATTEMPTS && specifiedUser.lastFailedLoginAttempt > new Date(Date.now() - FAILED_WAIT_TIME_MS)) {
        throw "Too many failed attempts. Try again later."
      }

      const user = await collectionUser.findOne({
        email,
        emailVerificationCode: code,
        verificationCodeEmailSentDate: { $gt: new Date(Date.now() - AuthEmailCodes.TOKEN_MAX_AGE_MS) } // Token is valid for up to 24h
       })
      if (!user) {
        if (!!specifiedUser) {
          specifiedUser.failedLoginAttempts += 1
          specifiedUser.lastFailedLoginAttempt = new Date()
          await specifiedUser.save()
        }
        throw "Email verification code is invalid."
      }
      user.emailVerified = true
      user.emailVerificationCode = null
      user.failedLoginAttempts = 0
      user.lastFailedLoginAttempt = new Date(0)
      user.verificationCodeEmailSentDate = new Date(0) // Allow to log in again instantly
      await user.save()

      await Auth.logInUser(req, user)
    } catch (error) {
      throw error
    }
  }

  public static sendVerificationEmail = async (user, appBasicInfo: AppBasicInfo, mailer: Mailer): Promise<string | undefined> => {

    let twoHours = 7200000
    if (user.verificationCodeEmailSentDate.getTime() >= Date.now() - twoHours) {
      throw "A verification email was already sent less than two hours ago. Please use the link you received."
    }

    const randomToken = Auth.generateRandomToken()

    user.emailVerificationCode = randomToken
    user = await user.save()

    if (!user) {
      return
    }

    const token = user.emailVerificationCode
    const results = await mailer.sendMailAsSupport(
      `${appBasicInfo.name} Email Verification`,
      [user.email],
      [],
      [],
      null,
      `Welcome to ${appBasicInfo.name}!<br/><br/>
    In order to log in please use this verification code:<br/><br/>
    <b>${user.emailVerificationCode}</b><br/><br/>
    You can also log in, by using link below:<br/><br/>
    <a href="${process.env.BASE_URL}/verify-email/${user.email}/${token}" target="_blank">Log In to ${appBasicInfo.name}</a><br/><br/>
    Have an amazing day!<br/>
    ${appBasicInfo.name}`,
      []
    )

    // Update sent time, to allow user to receive it again if email fails
    user.verificationCodeEmailSentDate = Date.now()
    user = await user.save()

    return results;
  }
}
