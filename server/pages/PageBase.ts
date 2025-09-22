// Copyright (C) Konrad Gadzinowski

import * as path from "path"

export class PageBase {
  private router: any

  public constructor(router: any) {
    this.router = router
  }

  public setup = () => {

    // Handle errors
    this.router.use((req, res, next) => {
      const error: any = new Error("Not Found")
      error.status = 404
      next(error)
    })

    this.router.use((error, req, res, next) => {
      // Set locals, only providing error in development
      res.locals.message = error.message
      res.locals.error = req.app.get("env") === "development" ? error : {}

      // Render the error page
      res.status(error.status || 500)
      res.render("error")
    })
  }
}
