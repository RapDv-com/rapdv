// Copyright (C) Konrad Gadzinowski

import React, { ReactNode } from "react"
import { RapDvApp } from "../RapDvApp"

export class PageBase {
  private router: any
  private getErrorView: (error: any) => Promise<ReactNode>

  public constructor(router: any, getErrorView: (error: any) => Promise<ReactNode>) {
    this.router = router
    this.getErrorView = getErrorView
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
      const errorView = await this.getErrorView(error)
      const contentText = render(errorView)
      
      res.status(error.status || 500)
      res.send(contentText)
    })
  }
}
