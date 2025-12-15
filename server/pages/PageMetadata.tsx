// Copyright (C) Konrad Gadzinowski

import { Request, Response } from "express"
import { HttpStatus } from "../network/HttpStatus"
import { AppBasicInfo, PagesDefinition } from "../RapDvApp"
import sharp from "sharp"

export class PageMetadata {
  protected ICON_MIN_SIZE = 8
  protected ICON_MAX_SIZE = 2500
  protected ICON_TYPES = ["png", "jpg", "jpeg", "webp"]
  protected publicUrls: Array<PagesDefinition> = []

  protected info: AppBasicInfo
  protected getDomain: (req: Request) => string
  protected getDynamicUrls: () => Promise<Array<PagesDefinition>>

  constructor(info: AppBasicInfo, getDomain: (req: Request) => string, getDynamicUrls: () => Promise<Array<PagesDefinition>>) {
    this.info = info
    this.getDomain = getDomain
    this.getDynamicUrls = getDynamicUrls
  }

  public getManifest = async (req: Request, res: Response) => {
    if (!!this.info.customManifest) {
      res.json(this.info.customManifest)
      return
    }

    res.json({
      name: this.info.name,
      icons: [
        {
          src: "/client/assets/favicon.svg",
          type: "image/svg+xml",
          sizes: "512x512"
        },
        {
          src: "/assets/icons/192.png",
          sizes: "192x192"
        },
        {
          src: "/assets/icons/128.png",
          sizes: "128x128"
        },
        {
          src: "/assets/icons/152.png",
          sizes: "152x152"
        },
        {
          src: "/assets/icons/144.png",
          sizes: "144x144"
        },
        {
          src: "/assets/icons/120.png",
          sizes: "120x120"
        },
        {
          src: "/assets/icons/114.png",
          sizes: "114x114"
        },
        {
          src: "/assets/icons/76.png",
          sizes: "76x76"
        },
        {
          src: "/assets/icons/72.png",
          sizes: "72x72"
        },
        {
          src: "/assets/icons/57.png",
          sizes: "57x57"
        }
      ],
      description: this.info.description,
      background_color: this.info.themeColor,
      theme_color: this.info.themeColor,
      developer: {
        name: "Konrad Gadzinowski"
      },
      default_locale: "en",
      launch_path: "/",
      start_url: "/",
      display: "fullscreen"
    })
  }

  public getIcon = async (req: Request, res: Response) => {
    const iconSizeType = req.params["icon"] || null
    if (!iconSizeType) {
      res.status(HttpStatus.BAD_REQUEST).send("Icon type is required")
      return
    }
    const isParamCorrect = /(^\d+)\.[a-zA-Z]+/i.test(iconSizeType)
    if (!isParamCorrect) {
      res.status(HttpStatus.BAD_REQUEST).send("You need to specify icon size and type, e.g. '128.png")
      return
    }

    const iconParams = iconSizeType.split(".")
    let size = parseInt(iconParams[0])
    const type = iconParams[1]

    if (!this.ICON_TYPES.includes(type)) {
      res.status(HttpStatus.BAD_REQUEST).send("Unsupported icon type. Supported types: " + this.ICON_TYPES.join(", "))
      return
    }

    size = Math.max(size, this.ICON_MIN_SIZE)
    size = Math.min(size, this.ICON_MAX_SIZE)

    const file = await sharp("./client/assets/favicon.svg")
      .ensureAlpha()
      .rotate()
      .resize(size, size, {
        fit: "cover"
      })
      .toFormat(type as any)
      .toBuffer()

    res.type(type).send(file)
  }

  public setPublicUrls = (publicUrls: Array<PagesDefinition>) => (this.publicUrls = publicUrls)

  public getRobotsTxt = async (req: Request, res: Response) => {
    res.status(HttpStatus.OK)
    res.type("text/plain")
    res.send("User-agent: *\n\n" + `Sitemap: ${this.getDomain(req)}/sitemap.xml`)
  }

  public getSitemap = async (req: Request, res: Response) => {
    res.status(HttpStatus.OK)
    res.type("application/xml")

    const dynamicUrls = await this.getDynamicUrls()

    const allUrls = [...this.publicUrls, ...dynamicUrls]

    const sortedPublicUrls = allUrls
    .filter((data) => {
      if (data.paths.length === 0) {
        return false
      }

      // Remove dynamic URLs
      for (const urlPath of data.paths) {
        const urlHasParameters = !!["*", "+", ":", ";", "?", "{", "}", "[", "]", "{", "}", "$", "\\"].find((character) => urlPath.includes(character))
        if (urlHasParameters) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      if (a.priority > b.priority) {
        return -1
      }
      if (a.priority < b.priority) {
        return 1
      }
      return 0
    })

    res.send(`<?xml version="1.0" encoding="UTF-8"?>
              <urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
              ${sortedPublicUrls
                .map(
                  (data) => `
                <url>
                  <loc>${process.env.BASE_URL}${data.paths[0]}</loc>
                  <priority>${data.priority}</priority>
                  <changefreq>${data.changefreq}</changefreq>
                </url>
              `
                )
                .join("")}
              </urlset>
              `)
  }
}
