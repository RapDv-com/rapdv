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
import ReactDOMServer from "react-dom/server"
import { CollectionUserSession } from "../database/CollectionUserSession"
import { ReactNode } from "react"

export class ServerListener {
  public express = express()
  expressViews: Array<string> = new Array()
  isProduction: boolean

  constructor(isProduction: boolean) {
    this.isProduction = isProduction
  }

  init = () => {
    const sessionOptions: any = {
      resave: true,
      saveUninitialized: true,
      store: MongoStore.create({
        client: mongoose.connection.getClient()
      }),
      secret: process.env.SESSION_SECRET,
      cookie: {
        maxAge: CollectionUserSession.DEFAULT_EXPERIATION_TIME_MS
      }
    }

    // view engine setup
    this.express.use(logger("dev"))
    this.express.use(bodyParser.urlencoded({ extended: true }))
    this.express.use(cookieParser())

    this.express.use(session(sessionOptions))
    this.express.use(passport.initialize())
    this.express.use(passport.session())
    this.express.use(flash())
    this.express.use(lusca.xframe("SAMEORIGIN"))
    this.express.use(lusca.xssProtection(true))

    this.express.use("/client", express.static("./client"))
    this.express.use("/dist", express.static("./dist"))
  }

  renderView = (res, content?: ReactNode) => {
    try {
      let contentText = ReactDOMServer.renderToStaticMarkup(content)
      contentText = contentText.replace(/{{_csrf}}/g, res.locals._csrf)
      res.send(content)
    } catch (error) {
      console.error("Error on rendering views. " + error)
    }
  }
}
