// Copyright (C) Konrad Gadzinowski

import express from 'express'
import logger from 'morgan'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import lusca from 'lusca'
import session from 'express-session'
import flash from 'express-flash'
import passport from 'passport'
import ReactDOMServer from 'react-dom/server'
import { CollectionUserSession } from '../database/CollectionUserSession'
import { ReactNode } from 'react'
import { Request } from './Request'

export class ServerListener {
  public static PAGE_CONTENT_SECURITY_POLICY = "base-uri 'self'; object-src 'none'; frame-ancestors 'self'"

  public express = express()
  expressViews: Array<string> = new Array()
  isProduction: boolean
  private sessionStore: session.Store

  constructor(isProduction: boolean, sessionStore: session.Store) {
    this.isProduction = isProduction
    this.sessionStore = sessionStore
  }

  init = () => {
    const sessionOptions: any = {
      resave: false,
      saveUninitialized: false,
      store: this.sessionStore,
      secret: process.env.SESSION_SECRET,
      cookie: {
        maxAge: undefined,
        httpOnly: true,
        sameSite: 'lax',
        // Secure whenever the request came over HTTPS, also through the reverse proxy
        secure: 'auto',
      },
    }

    // Read the protocol from a reverse proxy running on the same server
    this.express.set('trust proxy', 'loopback')

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
    this.express.use(lusca.nosniff())

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
      res.setHeader('Content-Security-Policy', ServerListener.PAGE_CONTENT_SECURITY_POLICY)
      res.send(contentText)
    } catch (error) {
      console.error('Error on rendering views. ' + error)
    }
  }
}
