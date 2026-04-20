// Copyright (C) Konrad Gadzinowski

import express from 'express'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import session from 'express-session'
import flash from 'express-flash'
import MySQLStore from 'express-mysql-session'
import mysql from 'mysql2/promise'
import passport from 'passport'
import ReactDOMServer from 'react-dom/server'
import { CollectionUserSession } from '../database/CollectionUserSession'
import { ReactNode } from 'react'
import { Request } from './Request'

export class ServerListener {
  public express = express()
  expressViews: Array<string> = new Array()
  isProduction: boolean

  constructor(isProduction: boolean) {
    this.isProduction = isProduction
  }

  init = () => {
    const dbUrl = new URL(process.env.DATABASE_URL)
    const pool = mysql.createPool({
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port) || 3306,
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.slice(1),
      ssl: { rejectUnauthorized: process.env.SKIP_DATABASE_SSL_CHECK != 'true' },
    })
    const SessionStore = MySQLStore(session)
    const store = new SessionStore({ createDatabaseTable: true }, pool)

    const sessionOptions: any = {
      resave: false,
      saveUninitialized: false,
      store,
      secret: process.env.SESSION_SECRET,
      cookie: {
        maxAge: undefined,
      },
    }

    // view engine setup
    this.express.use(logger('dev'))
    this.express.use(bodyParser.urlencoded({ extended: true }))
    this.express.use(cookieParser())

    this.express.use(session(sessionOptions))
    this.express.use(passport.initialize())
    this.express.use(passport.session())
    this.express.use(flash())
    this.express.use(lusca.xframe('SAMEORIGIN'))
    this.express.use(lusca.xssProtection(true))

    this.express.use((req: Request, res, next) => {
      const isLoggedIn = !!req.user

      req.session.cookie.maxAge = isLoggedIn
        ? CollectionUserSession.DEFAULT_USER_EXPERIATION_TIME_MS
        : CollectionUserSession.DEFAULT_GUEST_EXPERIATION_TIME_MS // Prevent session overflow

      next()
    })

    this.express.use('/client', express.static('./client'))
    this.express.use('/dist', express.static('./dist'))
  }

  renderHtmlView = (res, content?: ReactNode) => {
    try {
      let contentText = '<!DOCTYPE html>' + ReactDOMServer.renderToStaticMarkup(content)
      contentText = contentText.replace(/{{_csrf}}/g, res.locals._csrf)
      res.send(content)
    } catch (error) {
      console.error('Error on rendering views. ' + error)
    }
  }
}
