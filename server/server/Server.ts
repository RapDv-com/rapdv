// Copyright (C) Konrad Gadzinowski

import { ServerListener } from "./ServerListener"
import cluster from "cluster"
import { PageBase } from "../pages/PageBase"
import debug from "debug"
import dotenv from "dotenv"
import reload from "reload"
import * as http from "http"
import * as os from "os"
import { Database } from "../database/Database"
import { RapDvApp } from "../RapDvApp"
import { ReqType } from "../ReqType"
import { PageMetadata } from "../pages/PageMetadata"
import { CollectionSystem } from "../database/CollectionSystem"
import { PageSetup } from "../pages/PageSetup"
import { Auth } from "../auth/Auth"
import express from "express"
import chokidar from 'chokidar';

export class Server {

  app: RapDvApp
  appExpress
  database: Database

  port
  server
  getApp: () => RapDvApp
  debug = debug("final:server")
  numCPUs = os.cpus().length
  isProduction: boolean
  isReloadingApp: boolean = false
  reloadCtrl: any
  mainServer: any

  constructor(getApp: () => RapDvApp) {
    this.getApp = getApp
    this.isProduction = RapDvApp.isProduction()
  }

  start = async () => {
    this.loadConfiguration()

    this.isReloadingApp = false
    this.port = this.normalizePort(process.env.PORT ?? "3000")
    this.mainServer = express()
    this.mainServer.set("port", this.port)

    this.server = http.createServer(this.mainServer)

    // Use multi-core on production
    if (this.isProduction && cluster.isPrimary) {
      console.info("Main cluster setting up " + this.numCPUs + " workers...")
      for (let i = 0; i < this.numCPUs; i++) {
        cluster.fork()
      }

      cluster.on("online", (worker) => {
        console.info("Worker " + worker.process.pid + " is online")
      })

      cluster.on("exit", (worker, code, signal) => {
        console.info("Worker " + worker.process.pid + " died with code: " + code + ", and signal: " + signal)
        console.info("Starting a new worker")
        cluster.fork()
      })
    } else {
      this.server.listen(this.port)
      console.info("App runs on port " + this.port)
      this.server.on("error", (error) => {
        this.onError(error)
      })
      this.server.on("listening", () => {
        this.onListening()
      })

      await this.setupApp()

      if (!this.isProduction) {

        // Watch client files for changes
        const watcherDist = chokidar.watch(['./dist']);
        watcherDist.on('ready', () => {
          watcherDist.on('all', async () => {
            if (this.reloadCtrl) {
              this.reloadCtrl.reload()
            }
          });
        });
      }

      const handleRequest = async (req, res, next) => {
        this.appExpress.handle(req, res, next);
      }

      this.mainServer.get('*', handleRequest);
      this.mainServer.post('*', handleRequest);
      this.mainServer.put('*', handleRequest);
      this.mainServer.patch('*', handleRequest);
      this.mainServer.delete('*', handleRequest);
    }

    if (cluster.isPrimary) {
      if (!this.app) {
        await this.setupApp()
      }
      await this.app.addDatabaseEvolutions()
      this.app.startAllRecurringTasks()
    }
  }

  private setupApp = async () => {

    this.loadConfiguration()

    const app = this.getApp()
    this.database = app.createDatabase()
    await this.database.init(process.env.MONGODB_URI, this.isProduction)

    await this.database.initDatabaseContent(app.setRoles())
    const appListener = new ServerListener(this.isProduction)
    const appExpress = appListener.express

    appListener.init()
    Auth.configure()
    await app.initAuth()
    app.init(appExpress, appListener, this.database, cluster.isPrimary)
    await app.getStorage()

    await this.addSetupRoutes(app)
    const pageMetadata = this.addBasicRoutes(app)
    await app.getPages()
    pageMetadata.setPublicUrls(app.getPublicUrls())

    const pageBase = new PageBase(appExpress, appListener)
    pageBase.setup()

    // Set new app object
    this.appExpress = appExpress
    this.app = app

    if (!this.isProduction) {
      this.reloadCtrl = await reload(this.mainServer, { webSocketServerWaitStart: false })
    }
  }

  private addBasicRoutes = (app: RapDvApp): PageMetadata => {
    const pageMetadata = new PageMetadata(app.getBasicInfo(), app.getDomain, app.getDynamicUrls)
    app.addGenericRoute("/assets/manifest.json", ReqType.Get, pageMetadata.getManifest)
    app.addGenericRoute("/assets/icons/:icon", ReqType.Get, pageMetadata.getIcon)
    app.addGenericRoute("/robots.txt", ReqType.Get, pageMetadata.getRobotsTxt)
    app.addGenericRoute("/sitemap.xml", ReqType.Get, pageMetadata.getSitemap)
    return pageMetadata
  }

  private addSetupRoutes = async (app: RapDvApp) => {
    const system = await CollectionSystem.get()
    if (!system.isSetupFinished) {
      app.addRoute(Auth.SETUP_URL, ReqType.Get, PageSetup.render, "Setup", "Setup application", [Auth.SETUP])
      app.addRoute(Auth.SETUP_URL, ReqType.Post, PageSetup.finishSetup, "Setup", "Setup application", [Auth.SETUP])
    }
  }

  private loadConfiguration = () => {
    dotenv.config({ path: ".env.example", override: true })
    dotenv.config({ path: ".env", override: true })
  }

  /**
   * Normalize a port into a number, string, or false.
   */
  normalizePort = (val) => {

    const port = parseInt(val, 10)

    if (isNaN(port)) {
      // named pipe
      return val
    }

    if (port >= 0) {
      // port number
      return port
    }

    return false
  }

  /**
   * Event listener for HTTP server "error" event.
   */
  onError = (error) => {
    if (error.syscall !== "listen") {
      throw error
    }

    const bind = typeof this.port === "string" ? "Pipe " + this.port : "Port " + this.port

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges")
        process.exit(1)
        break
      case "EADDRINUSE":
        console.error(bind + " is already in use")
        process.exit(1)
        break
      default:
        throw error
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  onListening = () => {
    const addr = this.server.address()
    const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port
    this.debug("Listening on " + bind)
  }
}
