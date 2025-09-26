// Copyright (C) Konrad Gadzinowski

import express from "express"
import logger from "morgan"
import cookieParser from "cookie-parser"
import bodyParser from "body-parser"
import lusca from "lusca"
import session from "express-session"
import flash from "express-flash"
import MongoStore from "connect-mongo"
import passport from "passport"
import mongoose from "mongoose"
import { CollectionUserSession } from "../database/CollectionUserSession"
import { Request } from "./Request"
import { render } from "preact-render-to-string"

export class ServerListener {
  public express = express()
  isProduction: boolean

  constructor(isProduction: boolean) {
    this.isProduction = isProduction
  }

  init = () => {
    const sessionOptions: any = {
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
      }),
      secret: process.env.SESSION_SECRET,
      cookie: {
        maxAge: undefined
      }
    }

    this.express.use(logger("dev"))
    this.express.use(bodyParser.urlencoded({ extended: true }))
    this.express.use(cookieParser())

    this.express.use(session(sessionOptions))
    this.express.use(passport.initialize())
    this.express.use(passport.session())
    this.express.use(flash())
    this.express.use(lusca.xframe("SAMEORIGIN"))
    this.express.use(lusca.xssProtection(true))

    this.express.use((req: Request, res, next) => {
      // Set session duration based on login state
      const isLoggedIn = !!req.user

      req.session.cookie.maxAge = isLoggedIn
        ? CollectionUserSession.DEFAULT_USER_EXPERIATION_TIME_MS
        : CollectionUserSession.DEFAULT_GUEST_EXPERIATION_TIME_MS // Prevent session overflow

      next()
    });

    this.express.use("/client", express.static("./client"))
    this.express.use("/dist", express.static("./dist"))
  }

  renderView = (res, content?: any) => {
    let contentText = render(content)
    contentText = contentText.replace(/{{_csrf}}/g, res.locals._csrf)
    res.send(contentText)
  }
}
