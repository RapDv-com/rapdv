// Copyright (C) Konrad Gadzinowski

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
      // set locals, only providing error in development
      res.locals.message = error.message
      res.locals.error = req.app.get("env") === "development" ? error : {}

      // render the error page
      res.status(error.status || 500)
      res.render("error")
    })
  }
}
