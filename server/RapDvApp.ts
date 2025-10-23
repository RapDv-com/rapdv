#!/usr/bin/env node

// Copyright (C) Konrad Gadzinowski

import { Express, NextFunction } from "express"
import { ReqType } from "./ReqType"
import { ServerListener } from "./server/ServerListener"
import lusca from "lusca"
import ReactDOMServer from "react-dom/server"
import { Upload } from "./upload/Upload"
import { ReactNode } from "react"
import { Database } from "./database/Database"
import { Collection } from "./database/Collection"
import { Response } from "express"
import { IndexDefinition, Schema, SchemaDefinition } from "mongoose"
import { Auth } from "./auth/Auth"
import { Role } from "./Role"
import { UserRole } from "./database/CollectionUser"
import { FlashType, Request } from "./server/Request"
import { Types } from "./types/Types"
import { HtmlFlash } from "./ui/HtmlFlash"
import { ServerStyleSheet } from "styled-components"
import { Mailer } from "./mailer/Mailer"
import { CollectionImageFile } from "./database/CollectionImageFile"
import { LogType } from "./database/CollectionLog"
import express from "express"
import bodyParser from "body-parser"
import { Git } from "./system/Git"
import { CollectionUserSession } from "./database/CollectionUserSession"

export type EndpointLogic = (req: Request, res: Response, next: NextFunction, app: RapDvApp, mailer: Mailer) => void
export type TaskLogic = () => void
export type SetText = (req: Request, res: Response) => Promise<string>
export type SetBoolean = (req: Request, res: Response) => Promise<boolean>

export type AppBasicInfo = {
  name: string
  description: string
  themeColor: string
  customManifest?: JSON
}

export abstract class RapDvApp {
  public abstract getBasicInfo: () => AppBasicInfo
  public abstract getPages: () => Promise<void>
  public abstract getLayout: (
    req: Request,
    canonicalUrl: string,
    title: string,
    description: string,
    content: ReactNode | string,
    disableIndexing: boolean,
    clientFilesId: string,
    otherOptions?: any
  ) => Promise<ReactNode>
  public abstract getErrorView: (error: any) => Promise<{
    title: string,
    description: string,
    content: ReactNode
  }>
  public abstract initAuth: () => Promise<void>
  public abstract getStorage: () => Promise<void>
  public abstract startRecurringTasks: (mailer: Mailer) => Promise<void>
  public abstract addDatabaseEvolutions: () => Promise<void>

  protected MAX_FILES = 5
  protected MAX_FILE_SIZE_KB = 5120

  protected router: Express | any
  protected listener: ServerListener
  protected database: Database
  protected upload: any
  protected publicUrls: Array<{ path: string, priority: number, changefreq: string }> = []
  protected mailer: Mailer

  private commitNumber: string = Git.getCurrentCommitNumber(null) ?? Date.now().toString()

  public static isProduction = () => process.env.NODE_ENV === "production"

  public init = (router: Express, listener: ServerListener, database: Database, isPrimaryProcess: boolean) => {
    const isProduction = RapDvApp.isProduction()
    this.router = router
    this.listener = listener
    this.database = database
    this.upload = new Upload().build("uploads", this.MAX_FILE_SIZE_KB * 1024, this.MAX_FILES)
    const mailer = new Mailer(
      process.env.SEND_FROM_NAME,
      process.env.SEND_FROM_EMAIL,
      process.env.SEND_FROM_LOGIN,
      process.env.SEND_FROM_PASSWORD,
      process.env.SEND_FROM_HOST,
      process.env.SEND_FROM_PORT,
      isProduction
    )

    mailer.setOnMailSentListener(async (
      subject: string,
      toEmails: string[],
      ccEmails: string[],
      bccEmails: string[],
      fromEmail: string,
      replyTo: string,
      contentHtml: string
    ): Promise<any> => {
      const description = `To: ${toEmails.join(", ")}<br/>CC: ${ccEmails.join(", ")}<br/>BCC: ${bccEmails.join(", ")}<br/>From: ${fromEmail}<br/>Reply to: ${replyTo}<br/><br/>${subject}<br/><br/><br/> ${contentHtml}`
      await Collection.saveLog("Sent email: " + subject, LogType.EmailSent, description)
    })

    mailer.setOnMailSendErrorListener(async (
      error: any,
      subject: string,
      toEmails: string[],
      ccEmails: string[],
      bccEmails: string[],
      fromEmail: string,
      replyTo: string,
      contentHtml: string
    ): Promise<any> => {
      const description = `To: ${toEmails.join(", ")}<br/>CC: ${ccEmails.join(", ")}<br/>BCC: ${bccEmails.join(", ")}<br/>From: ${fromEmail}<br/>Reply to: ${replyTo}<br/><br/>${subject}<br/><br/><br/> ${contentHtml}<br/><br/><br/>Error:<br/><br/>${JSON.stringify(error)}`
      await Collection.saveLog("Couldn't send email: " + subject, LogType.Error, description)
    })

    this.mailer = mailer
  }

  public startAllRecurringTasks = () => {
    CollectionImageFile.startJobForRemovingAllUnusedImages()
    CollectionUserSession.startJobForRemovingAllExpiredSessions()
    this.startRecurringTasks(this.mailer)
  }

  public getPublicUrls = () => this.publicUrls

  public getMailer = () => this.mailer

  public getUpload = () => this.upload

  private getMetaText = async (req: Request, res: Response, text?: string | SetText, defaultText?: string) => {
    let result = defaultText ?? ""
    if (Types.isString(text)) result = text as string
    else if (text instanceof Function) result = await text(req, res)
    return result
  }

  private getMetaBoolean = async (req: Request, res: Response, value?: boolean | SetBoolean, defaultValue?: boolean) => {
    let result = defaultValue ?? false
    if (Types.isBoolean(value)) result = value as boolean
    else if (value instanceof Function) result = await value(req, res)
    return result
  }

  private renderViews =
    (
      ui: (req: Request, res: Response, next: NextFunction, app: RapDvApp, mailer: Mailer) => Promise<ReactNode | string>,
      title?: string | SetText,
      description?: string | SetText,
      disableIndexing?: boolean | SetBoolean,
      otherOptions?: any
    ) =>
      async (req: Request, res: Response, next: NextFunction) => {
        try {
          const renderedUi = await ui(req, res, next, this, this.mailer)
          if (renderedUi === undefined || renderedUi === null) {
            // The request was handled differently
            return
          }

          const appInfo = this.getBasicInfo()
          this.renderView(req, res, next, renderedUi, title, description, disableIndexing, otherOptions)
        } catch (error) {
          console.error("Error on rendering views. " + error)
        }
      }

  public renderView = async (
    req: Request,
    res: Response,
    next: NextFunction,
    renderedUi: ReactNode | string,
    title?: string | SetText,
    description?: string | SetText,
    disableIndexing?: boolean | SetBoolean,
    otherOptions?: any
  ) => {
    const sheet = new ServerStyleSheet()

    try {

      HtmlFlash.normalizeFlash(req, "errors")
      HtmlFlash.normalizeFlash(req, "warning")
      HtmlFlash.normalizeFlash(req, "info")
      HtmlFlash.normalizeFlash(req, "success")

      const pageTitle = await this.getMetaText(req, res, title, "---")
      const pageDescription = await this.getMetaText(req, res, description, "")
      const pageDisableIndexing = await this.getMetaBoolean(req, res, disableIndexing, false)

      let clientFilesId = ""
      if (RapDvApp.isProduction()) {
        clientFilesId = this.commitNumber ?? Date.now().toString()
      } else {
        // Invalidate cache in development mode
        clientFilesId = Date.now().toString()
      }

      const path = req.path === "/" ? "" : req.path
      const canonicalUrl = process.env.BASE_URL + path

      const content = await this.getLayout(
        req,
        canonicalUrl,
        pageTitle,
        pageDescription,
        renderedUi,
        pageDisableIndexing,
        clientFilesId,
        otherOptions
      )

      let contentText = "<!DOCTYPE html>" + ReactDOMServer.renderToStaticMarkup(sheet.collectStyles(content))
      const styleTags = sheet.getStyleTags()

      // Replace <!-- RAPDV_REACT_CUSTOM_STYLES --> with styleTags
      contentText = contentText.replace("&lt;!-- RAPDV_REACT_CUSTOM_STYLES --&gt;", styleTags)

      // Inject CSRF token
      contentText = contentText.replace(/{{_csrf}}/g, res.locals._csrf)

      res.send(contentText)
    } catch (error) {
      console.error("Error on rendering views. " + error)
    } finally {
      sheet.seal()
    }
  }

  public addRoute = (
    path: string | { path: string, priority: number, changefreq: string },
    reqType: ReqType,
    content: (req: Request, res: Response, next: NextFunction, app: RapDvApp, mailer: Mailer) => Promise<ReactNode | string>,
    title?: string | SetText,
    description?: string | SetText,
    restrictions?: (Role | UserRole | string)[],
    disableIndexing?: boolean | SetBoolean,
    enableFilesUpload?: boolean,
    otherOptions?: any
  ) => {
    if (!this.publicUrls) this.publicUrls = []
    const noRestructions = !restrictions || restrictions.length === 0
    const urlPath = Types.isString(path) ? path : (path as any).path
    const urlHasParameters = !!["*", "+", ":", ";", "?", "{", "}", "[", "]", "{", "}", "$", "\\"].find((character) => urlPath.includes(character))

    const isPublicUrlAdded: boolean = !!this.publicUrls.find((publicUrl) => publicUrl.path === urlPath)
    if (!isPublicUrlAdded && noRestructions && !urlHasParameters && !disableIndexing) {
      if (Types.isString(path)) {
        this.publicUrls.push({ path: path as string, priority: 0.5, changefreq: "weekly" })
      } else {
        this.publicUrls.push(path as { path: string, priority: number, changefreq: string })
      }
    }

    this.addGenericRoute(urlPath, reqType, this.renderViews(content, title, description, disableIndexing, otherOptions), restrictions, enableFilesUpload)
  }

  public addSimpleRoute = async (
    path: string,
    reqType: ReqType,
    content: Promise<ReactNode | string>,
    restrictions?: (Role | UserRole | string)[],
    enableFilesUpload?: boolean
  ) => {
    const renderedUi = await content
    const logic = async (req: Request, res: Response) => this.listener.renderHtmlView(res, renderedUi)
    this.addGenericRoute(path, reqType, logic, restrictions, enableFilesUpload)
  }

  public addGenericRoute = (
    path: string,
    reqType: ReqType,
    logic: (req: Request, res: Response, next: NextFunction) => any,
    restrictions?: (Role | UserRole | string)[],
    enableFilesUpload?: boolean
  ) => {
    const checkAuthorization = Auth.checkUserAuthorization(restrictions)
    const postSteps: any[] = [
      path,
      bodyParser.json(),
      enableFilesUpload ? this.upload.core.any() : this.upload.core.none(),
      this.upload.logUploadError,
      lusca({ csrf: true }),
      checkAuthorization,
      this.beforeRouteIsRendered(restrictions),
      Auth.checkSystem,
      logic
    ]

    if (reqType === ReqType.Get) {
      this.router.get(path, lusca({ csrf: true }), checkAuthorization, this.beforeRouteIsRendered(restrictions), Auth.checkSystem, logic)
    } else if (reqType === ReqType.Post) {
      this.router.post(...postSteps)
    } else if (reqType === ReqType.Put) {
      this.router.put(...postSteps)
    } else if (reqType === ReqType.Patch) {
      this.router.patch(...postSteps)
    } else if (reqType === ReqType.Delete) {
      this.router.delete(...postSteps)
    }
  }

  public beforeRouteIsRendered = (rolesAllowed: (Role | UserRole | string)[]) => async (req: Request, res: Response, next: NextFunction) => {
    next()
  }

  public addEndpoint = (
    path: string,
    reqType: ReqType,
    logic: EndpointLogic,
    restrictions?: (Role | UserRole | string)[],
    enableFilesUpload?: boolean,
    skipCsrfCheck?: boolean
  ) => {
    // Require user to be logged in
    const checkAuthorization = Auth.checkUserAuthorization(restrictions)
    const executeLogic = (req: Request, res, next) => logic(req, res, next, this, this.mailer)
    const checkCsrf = !skipCsrfCheck

    if (reqType === ReqType.Get) {
      this.router.get(path, lusca({ csrf: checkCsrf }), checkAuthorization, this.beforeEndpointIsCalled(restrictions), Auth.checkSystem, executeLogic)
    } else if (reqType === ReqType.Post) {
      this.router.post(
        path,
        bodyParser.json(),
        enableFilesUpload ? this.upload.core.any() : this.upload.core.none(),
        this.upload.logUploadError,
        lusca({ csrf: checkCsrf }),
        checkAuthorization,
        this.beforeEndpointIsCalled(restrictions),
        Auth.checkSystem,
        executeLogic
      )
    } else if (reqType === ReqType.Put) {
      this.router.put(path, bodyParser.json(), lusca({ csrf: checkCsrf }), checkAuthorization, this.beforeEndpointIsCalled(restrictions), Auth.checkSystem, executeLogic)
    } else if (reqType === ReqType.Patch) {
      this.router.patch(path, bodyParser.json(), lusca({ csrf: checkCsrf }), checkAuthorization, this.beforeEndpointIsCalled(restrictions), Auth.checkSystem, executeLogic)
    } else if (reqType === ReqType.Delete) {
      this.router.delete(path, bodyParser.json(), lusca({ csrf: checkCsrf }), checkAuthorization, this.beforeEndpointIsCalled(restrictions), Auth.checkSystem, executeLogic)
    }
  }

  public addRawEndpoint = (
    path: string,
    reqType: ReqType,
    logic: EndpointLogic,
  ) => {
    // Require user to be logged in
    const executeLogic = (req: Request, res, next) => logic(req, res, next, this, this.mailer)

    if (reqType === ReqType.Get) {
      this.router.get(path,
        express.raw({ type: 'application/json' }),
        executeLogic
      )
    } else if (reqType === ReqType.Post) {
      this.router.post(
        path,
        express.raw({ type: 'application/json' }),
        executeLogic
      )
    } else if (reqType === ReqType.Put) {
      this.router.put(path, express.raw({ type: 'application/json' }), executeLogic)
    } else if (reqType === ReqType.Patch) {
      this.router.patch(path, express.raw({ type: 'application/json' }), executeLogic)
    } else if (reqType === ReqType.Delete) {
      this.router.delete(path, express.raw({ type: 'application/json' }), executeLogic)
    }
  }

  public beforeEndpointIsCalled = (rolesAllowed: (Role | UserRole | string)[]) => async (req: Request, res: Response, next: NextFunction) => {
    next()
  }

  public addCollection = (name: string, schema: SchemaDefinition, indexes?: IndexDefinition[], modifySchema?: (schema: Schema) => Schema): Collection => {
    return new Collection(name, schema, indexes, modifySchema)
  }

  public addDbEvolution = (
    newVersion: number,
    description: string,
    onDbVersionChangedCallback: (currentVersion: number) => Promise<any>
  ): Promise<any> => {
    return this.database.updateDbVersion(newVersion, description, onDbVersionChangedCallback)
  }

  public getProtocol = (req: Request): string => {
    if (process.env.BASE_URL) {
      let protocol = process.env.BASE_URL.split("://")[0]
      return protocol;
    }
    return req.protocol
  }

  public getHost = (req: Request): string => {
    if (process.env.BASE_URL) {
      let baseDomain = process.env.BASE_URL.split("://")[1]
      return baseDomain;
    }
    return req.get("host")
  }

  public getDomain = (req: Request) => {
    return this.getProtocol(req) + "://" + this.getHost(req)
  }

  public getDynamicUrls = async (): Promise<Array<{ path: string, priority: number, changefreq: string }>> => {
    return []
  }

  public getRoles = (): string[] => []

  public getCustomUserProps = (): any => ({})

  public createDatabase = () => new Database()

  public redirectToPage = (req: Request, res: Response, next: NextFunction, url: string, flashMsg?: string, flashType: FlashType = FlashType.Warning) => {

    // Test current ULR without query paramters against the URL to redirect to
    // e.g. From URL 'http://www.example.com/admin/new?sort=desc' get only '/admin/new'
    const currentUrl = req?.url?.split("?")[0]
    if (currentUrl !== url) {
      if (flashMsg) req.flash(flashType, flashMsg)
      return res.redirect(url)
    } else {
      next()
      return
    }
  }
}
