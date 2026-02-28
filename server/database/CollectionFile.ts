// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, Entity } from 'typeorm'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { Collection } from './Collection'
import { Database } from './Database'
import fs from 'fs'
import crypto from 'crypto'
import { S3Client, DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

export enum FileStorageType {
  Database = 'database',
  S3 = 'S3',
}

@Entity('files')
export class File extends RapDvBaseEntity {
  @Column({ unique: true, nullable: true })
  key: string

  @Column({ default: false })
  isPublic: boolean

  @Column({ nullable: true, type: 'bytea' })
  data: Buffer

  @Column({ nullable: true })
  s3Key: string

  @Column({ nullable: true })
  name: string

  @Column({ nullable: true })
  storageType: string

  @Column({ nullable: true })
  encoding: string

  @Column({ nullable: true })
  mimetype: string

  @Column({ nullable: true, type: 'bigint' })
  size: number

  @Column({ nullable: true })
  md5: string

  async removeIfItsNotUsed(): Promise<boolean> {
    const allCollections = Collection.getAll()

    for (const collectionKey in allCollections) {
      const collection = allCollections[collectionKey]
      try {
        const metadata = Database.dataSource.getMetadata(collection.entityClass)
        for (const relation of metadata.relations) {
          if (relation.inverseEntityMetadata.target === File) {
            const idColumn = relation.propertyName + 'Id'
            const query: any = {}
            query[idColumn] = this.id
            const count = await collection.count(query)
            if (count > 0) {
              return false
            }
          }
        }
      } catch (e) {
        // Skip if metadata not available for this collection
      }
    }

    // Remove S3 file if needed
    if (this.storageType === FileStorageType.S3) {
      try {
        const s3 = CollectionFile.getS3()
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: this.s3Key,
        }
        await s3.send(new DeleteObjectCommand(params))
      } catch (error) {
        console.error(`Failed to delete file from S3: ${error}`)
        throw error
      }
    }

    await this.remove()
    return true
  }

  async loadData(): Promise<Buffer> {
    try {
      if (this.storageType === FileStorageType.S3) {
        const s3 = CollectionFile.getS3()
        const params = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: this.s3Key,
        }
        const data: any = await s3.send(new GetObjectCommand(params))
        return await CollectionFile.streamToBuffer(data.Body as Readable)
      } else {
        return this.data
      }
    } catch (error) {
      console.error(`Couldn't load file data. Bucket: ${process.env.AWS_S3_BUCKET_NAME}, file key: ${this.s3Key} `, error)
      return null
    }
  }
}

export class CollectionFile extends Collection {
  private static DEBUG = false
  private static NAME = 'File'

  constructor() {
    super(CollectionFile.NAME, File)
  }

  public static streamToBuffer = async (readableStream: Readable): Promise<Buffer> => {
    const chunks = []
    for await (const chunk of readableStream) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  }

  public static getS3 = () => {
    const config: S3ClientConfig = {
      region: process.env.AWS_S3_REGION,
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
    }

    if (process.env.AWS_S3_ENDPOINT) {
      config.endpoint = process.env.AWS_S3_ENDPOINT
      config.forcePathStyle = true
    }

    const s3client = new S3Client(config)
    return s3client
  }

  public static getIt() {
    return Collection.get(CollectionFile.NAME) as CollectionFile
  }

  public static removeFile(filePath: string) {
    try {
      if (!fs.existsSync(filePath)) return
      fs.unlinkSync(filePath)
    } catch (exception) {
      Collection.onError('Couldn\'t remove file', 'Couldn\'t remove file: ' + filePath)
    }
  }

  public static generateTempFilePath(): string {
    let destDir = './tmp'

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir)
    }

    let path = destDir + '/' + CollectionFile.generateRandomFileName(12)
    while (fs.existsSync(path)) {
      path = destDir + '/' + CollectionFile.generateRandomFileName(12)
    }

    return path
  }

  public static generateRandomFileName(randomTextLength = 12): string {
    let text = ''
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    randomTextLength = Math.max(randomTextLength, 1)

    for (let i = 0; i < randomTextLength; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
  }

  public createFileFromUpload = (storageType: FileStorageType, fileData: any): Promise<any> => {
    return this.createFile(fileData.originalname, storageType, fileData.path, fileData.encoding, fileData.mimetype, fileData.size, false)
  }

  public createFile = (
    name: string,
    storageType: FileStorageType,
    filePath: string,
    encoding: string,
    mimetype: string,
    size: number,
    isPublic: boolean
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const hashStream = crypto.createHash('md5').setEncoding('hex')
      fs.createReadStream(filePath)
        .pipe(hashStream)
        .on('finish', async () => {
          const md5: String = hashStream.read()
          const file = this.createFileFromContent(
            name,
            md5,
            storageType,
            filePath,
            encoding,
            mimetype,
            size,
            isPublic,
            async () => {
              return fs.readFileSync(filePath)
            },
            async () => {
              CollectionFile.removeFile(filePath)
            }
          )
          resolve(file)
        })
    })
  }

  public createFileFromText = (
    name: string,
    storageType: FileStorageType,
    content: string,
    encoding: string,
    mimetype: string,
    isPublic: boolean
  ): Promise<any> => {
    if (!content) {
      return null
    }

    const size = content.length
    const hash = crypto.createHash('md5').update(content).digest('hex')

    const file = this.createFileFromContent(
      name,
      hash,
      storageType,
      'From Text',
      encoding,
      mimetype,
      size,
      isPublic,
      async () => {
        return Buffer.from(content)
      },
      async () => {
        // Nothing to remove
      }
    )

    return file
  }

  public createFileFromContent = (
    name: string,
    md5: String,
    storageType: FileStorageType,
    filePath: string,
    encoding: string,
    mimetype: string,
    size: number,
    isPublic: boolean,
    readData: () => Promise<any>,
    removeFile: () => Promise<void>
  ): Promise<any> => {
    const self = this
    return new Promise(async (resolve, reject) => {
      if (CollectionFile.DEBUG) {
        console.info('Creating file: ' + name + ', ' + filePath + ', ' + encoding + ', ' + mimetype + ', ' + size + ', ' + md5)
      }

      try {
        let file = await this.findDuplicate(encoding, mimetype, size, md5)

        if (file) {
          await removeFile()
          return resolve(file)
        }

        const key = await self.generateKey(null, name, this.findByKey)

        if (storageType === FileStorageType.S3) {
          const data = await readData()
          let params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: key,
            Body: data,
          }

          const s3 = CollectionFile.getS3()
          await s3.send(new PutObjectCommand(params))

          file = self.repository.create({
            key,
            isPublic,
            s3Key: key,
            name,
            storageType,
            encoding,
            mimetype,
            size,
            md5,
          })
        } else {
          const data = await readData()
          file = self.repository.create({
            key,
            isPublic,
            data,
            name,
            storageType,
            encoding,
            mimetype,
            size,
            md5,
          })
        }

        try {
          await self.repository.save(file)
          resolve(file)
        } catch (error) {
          reject(error)
        } finally {
          await removeFile()
        }
      } catch (error) {
        Collection.onError(
          'Couldn\'t find file duplicate',
          'Error on finding file duplicate: ' + name + ', ' + filePath + ', ' + encoding + ', ' + mimetype + ', ' + size + ', ' + md5 + '. ' + error
        )
      }
    })
  }

  public findByKeyOrId = async (keyOrId): Promise<any> => {
    if (!keyOrId) return null

    try {
      let result = await this.findByKey(keyOrId)
      if (!!result) return result
      result = await this.findById(keyOrId)
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionFile.findByKeyOrId. ' + error)
      return null
    }
  }

  public findByKey = async (key): Promise<any> => {
    if (!key) return null

    try {
      let result = await this.repository.findOne({ where: { key }, order: { createdAt: 'ASC' } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionFile.findByKey. ' + error)
      return null
    }
  }

  public findDuplicate = (encoding: String, mimetype: String, size: Number, md5: String): Promise<any> => {
    if (encoding == null || encoding == undefined || !mimetype || size == null || size == undefined || !md5 || mimetype.length == 0 || md5.length == 0) {
      throw new Error('Not enough data to find duplicate.')
    }

    return this.repository.findOne({
      where: {
        encoding: encoding as string,
        mimetype: mimetype as string,
        size: size as number,
        md5: md5 as string,
      },
      order: { createdAt: 'ASC' },
    })
  }

  public findById = async (id: any): Promise<any> => {
    if (!id) return null

    try {
      const idStr = id._id ? id._id.toString() : id.toString()
      let result = await this.repository.findOne({ where: { id: idStr }, order: { createdAt: 'ASC' } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionFile.findById. ' + error)
      return null
    }
  }
}
