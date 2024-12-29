// Copyright (C) Konrad Gadzinowski

import sharp, { FormatEnum } from "sharp"

export class ImageInfo {
  public path: string
  public format: string
  public mime: string
  public size: number

  constructor(path: string, format: string, mime: string, size: number) {
    this.path = path
    this.format = format
    this.mime = mime
    this.size = size
  }
}

export class ImageProcessor {
  public async processUploadedImage(
    filePath: string,
    maxSizePx: number = 2000,
    cropToSquare: boolean = false,
    format: string = "jpeg"
  ): Promise<ImageInfo> {
    return new Promise(async (resolve: (result: ImageInfo) => void, reject) => {
      let imageResize = sharp(filePath)
        .ensureAlpha()
        .rotate()
        .resize(maxSizePx, maxSizePx, {
          fit: cropToSquare ? "cover" : "inside",
          withoutEnlargement: true
        })
        .toFormat(format as any)

      let outputPath = filePath + "-proc." + format

      imageResize.toFile(outputPath, (error, info) => {
        if (error) return reject(error)
        if (!info) return reject("Couldn't process image.")

        return resolve(new ImageInfo(outputPath, info.format, "image/" + info.format, info.size))
      })
    })
  }
}
