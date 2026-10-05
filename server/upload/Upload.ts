// Copyright (C) Konrad Gadzinowski

import multer from "multer"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { FlashType } from "../server/Request"

export class Upload {
  private static SAFE_EXTENSION_PATTERN = /^\.[a-zA-Z0-9]{1,10}$/

  maxFileSizeBytes: number

  core: any

  public build = (folder = "uploads", maxFileSizeBytes = 1048576, maxFiles = 1) => {
    let self = this
    this.maxFileSizeBytes = maxFileSizeBytes

    let baseDir = path.sep + "tmp"
    let targetDir = baseDir + path.sep + folder

    // Create required directory
    self.createDirIfDontExist(baseDir)
    self.createDirIfDontExist(targetDir)

    var storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, targetDir)
      },
      filename: (req, file, cb) => {
        cb(null, Upload.getRandomFileName(file.originalname))
      }
    })

    var upload = multer({
      storage: storage,
      limits: { fileSize: maxFileSizeBytes, files: maxFiles }
    })

    this.core = upload

    return this
  }

  removeFilesAfterResponse = (req, res, next) => {
    res.once("close", () => Upload.removeUploadedFiles(req))
    next()
  }

  private static removeUploadedFiles = (req) => {
    const uploadedFiles: any[] = Array.isArray(req.files) ? [...req.files] : Object.values(req.files ?? {}).flat()
    if (req.file) uploadedFiles.push(req.file)

    for (const uploadedFile of uploadedFiles) {
      fs.rm(uploadedFile.path, { force: true }, (error) => {
        if (error) console.error("Couldn't remove uploaded file " + uploadedFile.path + ". " + error)
      })
    }
  }

  private static getRandomFileName = (originalName: string): string => {
    const extension = path.extname(originalName ?? "")
    const safeExtension = Upload.SAFE_EXTENSION_PATTERN.test(extension) ? extension : ""
    return crypto.randomUUID() + safeExtension
  }

  createDirIfDontExist = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath)
    }
  }

  logUploadError = (error, req, res, next) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        error = "Uploaded file is too big. It can be maximum " + this.maxFileSizeBytes / 1024 / 1024 + "Mb"
      }
      req.flash(FlashType.Errors, error)
      req.error = error
    }

    next()
  }
}
