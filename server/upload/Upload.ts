// Copyright (C) Konrad Gadzinowski

import multer from "multer"
import fs from "fs"
import path from "path"
import { FlashType } from "../server/Request"

export class Upload {
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
        cb(null, file.originalname)
      }
    })

    var upload = multer({
      storage: storage,
      limits: { fileSize: maxFileSizeBytes, files: maxFiles }
    })

    this.core = upload

    return this
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
