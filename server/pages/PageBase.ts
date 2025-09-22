// Copyright (C) Konrad Gadzinowski

import * as path from "path"

export interface IPageBase {
  addViewPath(viewsPath: string)
}

export class PageBase {
  private router: any
  private listener: IPageBase

  public constructor(router: any, listener: IPageBase) {
    this.router = router
    this.listener = listener
  }

  public setup = () => {
    this.listener.addViewPath(path.join(__dirname, path.sep + "views"))

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
