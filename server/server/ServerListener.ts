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
import { Git } from "../system/Git"
import { Request } from "./Request"

export class ServerListener {
  public express = express()
  isProduction: boolean
  private commitNumber: string = Git.getCurrentCommitNumber(null) ?? Date.now().toString()

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

  renderView = (res, viewName: string, content?: any) => {
    res.render(viewName, { layout: null, content })
  }

  renderPage = (req, res, viewName: string, title: string, description: string, disableIndexing: boolean, styleTags: any, headAdditionalTags: any, data?: any) => {

    let clientFilesId = ""
    if (this.isProduction) {
      clientFilesId = this.commitNumber ?? Date.now().toString()
    } else {
      // Invalidate cache in development mode
      clientFilesId = Date.now().toString()
    }

    const path = req.path === "/" ? "" : req.path

    res.render(viewName, {
      title,
      description,
      layout: "layout",
      theme: process.env.APP_THEME,
      disableIndexing,
      isProduction: this.isProduction,
      styleTags,
      clientFilesId,
      headAdditionalTags,
      canonicalUrl: process.env.BASE_URL + path,
      ...data
    })
  }
}
