// Copyright (C) Konrad Gadzinowski

import passport from "passport"
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Collection } from "../database/Collection";
import { CollectionUser, UserRole, UserStatus } from "../database/CollectionUser";
import { Auth } from "./Auth";

export class AuthGoogle {

  private static DEBUG = false

  public static configure = () => {

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.warn("Google OAuth2 is not configured. GOOGLE_CLIENT_ID is missing.")
      return
    }
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.BASE_URL + "/log-in/google/callback",
      userProfileURL: "https://www.googleapis.com/oauth2/v2/userinfo",
      passReqToCallback: true,
    },
    async (req, token, tokenSecret, profile, done) => {

      if (AuthGoogle.DEBUG) console.info("GOOGLE DATA: " + JSON.stringify(profile));

      let id: string = profile._json.id;
      let email: string = profile._json.email;
      let firstName: string = profile._json.first_name || profile._json.given_name;
      let lastName: string = profile._json.last_name || profile._json.family_name;
      let verifiedEmail: boolean = profile._json.verified_email;
      let pictureUrl: string = profile._json.picture;

      try {
        const user = await this.loginUsingSocialProvider(req, "google", id, email, firstName, lastName,
          verifiedEmail, pictureUrl);
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
    ));
  }

  public static async loginUsingSocialProvider(req, provider: string, id: string, email: string, firstName: string, lastName: string, verifiedEmail: boolean, pictureUrl: string) {

    const collectionUser = Collection.get("User") as CollectionUser

    let existingUser = await collectionUser.findOne({ email })

    if (existingUser) {
      existingUser.addProvider(id, provider);
      if (!existingUser.photoId && pictureUrl) {
        await existingUser.setPhotoFromUrl(pictureUrl);
        await existingUser.save();
      }

      if (!existingUser.emailVerified && verifiedEmail) {
        existingUser.emailVerified = true;
        await existingUser.save();
      }
      const userLoggedIn = await Auth.logInUser(req, existingUser)
      return userLoggedIn;
    }
    const user = await CollectionUser.createUserForAuthEmailCodes(email, verifiedEmail, firstName ?? "", lastName ?? "", UserRole.User, UserStatus.Live, "")
    user.loginProviders = [{id: id, name: provider}];
    user.emailVerified = verifiedEmail;
    if (pictureUrl) await user.setPhotoFromUrl(pictureUrl);
    await user.save();

    const userLoggedIn = await Auth.logInUser(req, user)
    return userLoggedIn;
  }
}
