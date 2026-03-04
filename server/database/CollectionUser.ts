// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, ForeignKey, Table, Unique } from 'sequelize-typescript'
import { Op } from 'sequelize'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { CollectionImageFile, ImageFile } from './CollectionImageFile'
import bcrypt from 'bcrypt-nodejs'
import { Collection } from './Collection'
import { FileStorageType } from './CollectionFile'

export enum UserRole {
  User = 'User',
  Admin = 'Admin',
}

export enum UserStatus {
  Live = 'Live',
  Banned = 'Banned',
}

@Table({ tableName: 'users', timestamps: true })
export class User extends RapDvBaseEntity {
  private static GIVE_TIME_TO_VERIFY_MS = 7200000 // 2h

  @Unique
  @Column({ allowNull: true })
  email: string

  @Column({ defaultValue: false })
  emailVerified: boolean

  @Column({ allowNull: true })
  emailVerificationCode: string

  @Column({ allowNull: true, type: DataType.DATE })
  verificationCodeEmailSentDate: Date

  @Column({ allowNull: true })
  password: string

  @Column({ defaultValue: 0 })
  failedLoginAttempts: number

  @Column({ allowNull: true, type: DataType.DATE })
  lastFailedLoginAttempt: Date

  @Column({ type: DataType.JSONB, defaultValue: [] })
  loginProviders: Array<{ id: string; name: string }>

  @Column({ allowNull: true })
  firstName: string

  @Column({ allowNull: true })
  lastName: string

  @ForeignKey(() => ImageFile)
  @Column({ allowNull: true, type: DataType.UUID })
  photoId: string

  @BelongsTo(() => ImageFile)
  photo: ImageFile

  @Column({ defaultValue: UserStatus.Live })
  status: string

  @Column({ allowNull: true, type: DataType.TEXT })
  notes: string

  @Column({ defaultValue: UserRole.User })
  role: string

  @BeforeCreate
  static async hashPasswordBeforeCreate(instance: User) {
    if (instance.password && !instance.password.startsWith('$2a$') && !instance.password.startsWith('$2b$')) {
      instance.password = bcrypt.hashSync(instance.password, bcrypt.genSaltSync(10))
    }
  }

  @BeforeUpdate
  static async hashPasswordBeforeUpdate(instance: User) {
    if (instance.password && !instance.password.startsWith('$2a$') && !instance.password.startsWith('$2b$')) {
      instance.password = bcrypt.hashSync(instance.password, bcrypt.genSaltSync(10))
    }
  }

  getFullName(): string {
    let fullName = this.firstName
    if (!!this.lastName && this.lastName.length > 0) {
      if (!!fullName && fullName.length > 0) fullName += ' '
      fullName += this.lastName
    }
    return fullName
  }

  comparePassword(candidatePassword: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(candidatePassword, this.password, (error, isMatch) => {
        if (error) reject(error)
        else resolve(isMatch)
      })
    })
  }

  isBanned(): boolean {
    return this.status == UserStatus.Banned
  }

  isLive(): boolean {
    return this.status == UserStatus.Live
  }

  isUser(): boolean {
    return this.role == UserRole.User
  }

  isAdmin(): boolean {
    return this.role == UserRole.Admin
  }

  isEmailVerified(): boolean {
    if (this.emailVerified) return true

    const registeredAt = this.createdAt?.getTime() ?? 0
    let registeredTimeElapsed = Date.now() - registeredAt
    if (registeredTimeElapsed > User.GIVE_TIME_TO_VERIFY_MS) {
      return false
    }

    return true
  }

  async getPhotoSrc(): Promise<string> {
    const imageUrl = await CollectionImageFile.getImageUrl(this.photoId, CollectionUser.DEFAULT_PHOTO_URL)
    return imageUrl
  }

  async setPhotoFromUrl(pictureUrl: string): Promise<void> {
    try {
      let imageFile = await CollectionImageFile.createImageFromUrl(
        pictureUrl,
        process.env.STORE_USER_PHOTOS_IN_S3 === 'true' ? FileStorageType.S3 : FileStorageType.Database,
        'jpeg',
        '7bit',
        false
      )
      if (imageFile) {
        this.photoId = imageFile._id
      }
    } catch (err) {
      console.error('Couldn\'t save profile photo from URL. ', err)
    }
  }

  addProvider(id: string, provider: string): void {
    if (!this.loginProviders || this.loginProviders.length == 0 || this.loginProviders.constructor !== Array) {
      this.loginProviders = [{ id, name: provider }]
      return
    }

    for (let providerExisting of this.loginProviders) {
      if (providerExisting.name == provider) return
    }

    this.loginProviders.push({ id, name: provider })
  }

  getStatusBadge(): string {
    if (this.status == UserStatus.Live) {
      return 'success'
    } else if (this.status == UserStatus.Banned) {
      return 'danger'
    }
    return 'warning'
  }
}

export class CollectionUser extends Collection {
  private static ROLES = []
  static DEFAULT_PHOTO_URL = '/client/assets/avatar-default.svg'

  public static getRoles = (): string[] => CollectionUser.ROLES

  constructor(customRoles: string[], customProps: any = {}) {
    CollectionUser.ROLES = [UserRole.User, UserRole.Admin, ...customRoles]
    super('User', User)
  }

  public static isValidStatus = (status): boolean => {
    return UserStatus.Live == status || UserStatus.Banned == status
  }

  public static createUserForAuthEmail = async (
    email: string,
    emailVerified: boolean,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole | string,
    status: UserStatus,
    notes: string
  ): Promise<any> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      const newInstance = collectionUser.repository.create({
        email,
        emailVerified,
        verificationCodeEmailSentDate: new Date(0),
        password,
        firstName,
        lastName,
        role,
        status,
        notes,
        failedLoginAttempts: 0,
        lastFailedLoginAttempt: new Date(0),
      })
      await collectionUser.repository.save(newInstance)
      return newInstance
    } catch (error) {
      let errorMsg = 'Couldn\'t create user. ' + error
      Collection.onError('Couldn\'t create user', errorMsg)
      throw errorMsg
    }
  }

  public static createUserForAuthEmailCodes = async (
    email: string,
    emailVerified: boolean,
    firstName: string,
    lastName: string,
    role: UserRole | string,
    status: UserStatus,
    notes: string
  ): Promise<any> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      const newInstance = collectionUser.repository.create({
        email,
        emailVerified,
        verificationCodeEmailSentDate: new Date(0),
        firstName,
        lastName,
        role,
        status,
        failedLoginAttempts: 0,
        lastFailedLoginAttempt: new Date(0),
        notes,
      })
      await collectionUser.repository.save(newInstance)
      return newInstance
    } catch (error) {
      let errorMsg = 'Couldn\'t create user. ' + error
      Collection.onError('Couldn\'t create user', errorMsg)
      throw errorMsg
    }
  }

  public static findUserByEmail = async (email: string): Promise<any> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      const result = await User.findOne({ where: { email }, order: [['createdAt', 'ASC']] })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUserByEmail. ' + error)
      return null
    }
  }

  public static findUserById = async (id: any) => {
    if (!id) return null

    try {
      const idStr = id._id ? id._id.toString() : id.toString()
      const result = await User.findOne({ where: { id: idStr } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUserById. ' + error)
      return null
    }
  }

  public static findUsersByStatus = async (fromPosition: number, usersMax: number, status: UserStatus, newestFirst: boolean = true) => {
    try {
      let result = await User.findAll({
        where: { status },
        offset: fromPosition,
        limit: usersMax,
        order: [['createdAt', newestFirst ? 'DESC' : 'ASC']],
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUsersByStatus. ' + error)
      return null
    }
  }

  public static findUsers = async (filter?: string, status?: string, fromPosition?: number, usersMax?: number, userRole?: UserRole): Promise<any> => {
    try {
      const where: any = {}

      if (!!status && status.toLowerCase() !== 'all' && CollectionUser.isValidStatus(status)) {
        where.status = status
      }

      if (!!userRole) {
        where.role = userRole
      }

      if (filter != null && filter.length > 0) {
        where[Op.and] = where[Op.and] || []
        where[Op.and].push({
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${filter}%` } },
            { lastName: { [Op.iLike]: `%${filter}%` } },
            { email: { [Op.iLike]: `%${filter}%` } },
            { role: { [Op.iLike]: `%${filter}%` } },
          ],
        })
      }

      const options: any = {
        where,
        order: [['createdAt', 'DESC']],
      }

      if (fromPosition !== undefined && fromPosition >= 0) {
        options.offset = fromPosition
      }

      if (usersMax !== undefined && usersMax > 0) {
        options.limit = usersMax
      }

      const results = await User.findAll(options)
      return results
    } catch (error) {
      Collection.onError('Couldn\'t get users', 'Error on getting users. ' + error)
      return []
    }
  }

  public static findAllUsersByRole = async (userRole: UserRole): Promise<any> => {
    try {
      let result = await User.findAll({
        where: { role: userRole },
        order: [['createdAt', 'DESC']],
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findAllUsersByRole. ' + error)
      return null
    }
  }

  public static getAllUsersCount = async (filter?: string, status?: string, userRole?: UserRole): Promise<number> => {
    try {
      const where: any = {}

      if (!!status && status.toLowerCase() !== 'all' && CollectionUser.isValidStatus(status)) {
        where.status = status
      }

      if (!!userRole) {
        where.role = userRole
      }

      if (filter != null && filter.length > 0) {
        where[Op.and] = where[Op.and] || []
        where[Op.and].push({
          [Op.or]: [
            { firstName: { [Op.iLike]: `%${filter}%` } },
            { lastName: { [Op.iLike]: `%${filter}%` } },
            { email: { [Op.iLike]: `%${filter}%` } },
            { role: { [Op.iLike]: `%${filter}%` } },
          ],
        })
      }

      const count = await User.count({ where })
      return count
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.getAllUsersCount. ' + error)
      return 0
    }
  }

  public static findAllValidAdmins = (): Promise<any[]> =>
    CollectionUser.findUsers(undefined, UserStatus.Live, undefined, undefined, UserRole.Admin)
}
