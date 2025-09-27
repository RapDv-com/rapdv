// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { RapDvApp } from "../RapDvApp"

export class PageBase {
  private router: any
  private app: RapDvApp

  public constructor(router: any, app: RapDvApp) {
    this.router = router
    this.app = app
  }

  public setup = () => {
    // Handle errors
    this.router.use((req, res, next) => {
      const error: any = new Error("Not Found")
      error.status = 404
      next(error)
    })

    this.router.use(async (error, req, res, next) => {
      // Set locals, only providing error in development
      res.locals.message = error.message
      res.locals.error = RapDvApp.isProduction() ? {} : error

      // Render the error page
      const errorView = await this.app.getErrorView(error)
      res.status(error.status || 500)
      this.app.renderView(
          req,
          res,
          next,
          errorView.content,
          errorView.title,
          errorView.description,
          true
        )
      
    })
  }
}
