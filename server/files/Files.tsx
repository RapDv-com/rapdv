// Copyright (C) Konrad Gadzinowski

import { Response } from "express"
import fs from "fs"
import { Collection } from "../database/Collection"
import { CollectionFile } from "../database/CollectionFile"
import { HttpStatus } from "../network/HttpStatus"

export class Files {
  public static PRIVATE_CACHE_CONTROL = "private, no-store"

  // Types that browsers can't run scripts in, when they are opened directly
  private static INLINE_CONTENT_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/avif", "application/pdf"]
  private static DEFAULT_CONTENT_TYPE = "application/octet-stream"
  private static PDF_SIGNATURE = "%PDF-"

  public static downloadFileById = async (fileId: String, res: Response) => {
    const collectionFile = Collection.get("File") as CollectionFile
    let file = await collectionFile.findById(fileId)
    this.downloadFile(file, res)
  }

  public static downloadFileByKey = async (key: String, res: Response) => {
    const collectionFile = Collection.get("File") as CollectionFile
    let file = await collectionFile.findByKey(key)
    this.downloadFile(file, res)
  }

  public static downloadFile = async (file: any, res: Response) => {
    if (!file) {
      res.status(HttpStatus.NOT_FOUND)
      res.send("Couldn't find file. ")
      return
    }

    const data = await file.loadData()

    res.status(HttpStatus.OK)
    Files.setSafeContentHeaders(res, file.mimetype, file.name)
    res.send(data)
  }

  /**
   * Uploaded files keep the content type declared by the uploader, so anything that could run scripts on our domain is downloaded instead of opened
   */
  public static setSafeContentHeaders = (res: Response, mimetype?: string, fileName?: string) => {
    res.contentType(mimetype || Files.DEFAULT_CONTENT_TYPE)
    const contentType = (res.get("Content-Type") ?? "").split(";")[0].trim().toLowerCase()

    if (!Files.INLINE_CONTENT_TYPES.includes(contentType)) {
      res.setHeader("Content-Disposition", `attachment; filename="${Files.getSafeFileName(fileName)}"`)
    }
    res.setHeader("X-Content-Type-Options", "nosniff")
  }

  public static isPdfFile = async (filePath: string): Promise<boolean> => {
    const fileHandle = await fs.promises.open(filePath, "r")
    try {
      const signature = Buffer.alloc(Files.PDF_SIGNATURE.length)
      await fileHandle.read(signature, 0, signature.length, 0)
      return signature.toString("latin1") === Files.PDF_SIGNATURE
    } finally {
      await fileHandle.close()
    }
  }

  private static getSafeFileName = (fileName?: string): string => (fileName ?? "file").replace(/[^a-zA-Z0-9._ -]/g, "_")
}
