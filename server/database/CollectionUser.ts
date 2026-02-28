// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from 'typeorm'
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

@Entity('users')
export class User extends RapDvBaseEntity {
  private static GIVE_TIME_TO_VERIFY_MS = 7200000 // 2h

  @Column({ unique: true, nullable: true })
  email: string

  @Column({ default: false })
  emailVerified: boolean

  @Column({ nullable: true })
  emailVerificationCode: string

  @Column({ nullable: true, type: 'timestamptz' })
  verificationCodeEmailSentDate: Date

  @Column({ nullable: true })
  password: string

  @Column({ default: 0 })
  failedLoginAttempts: number

  @Column({ nullable: true, type: 'timestamptz' })
  lastFailedLoginAttempt: Date

  @Column({ type: 'jsonb', default: [] })
  loginProviders: Array<{ id: string; name: string }>

  @Column({ nullable: true })
  firstName: string

  @Column({ nullable: true })
  lastName: string

  @ManyToOne(() => ImageFile, { nullable: true })
  photo: ImageFile

  @Column({ nullable: true })
  photoId: string

  @Column({ default: UserStatus.Live })
  status: string

  @Column({ nullable: true, type: 'text' })
  notes: string

  @Column({ default: UserRole.User })
  role: string

  @BeforeInsert()
  @BeforeUpdate()
  async hashPasswordIfNeeded() {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      this.password = bcrypt.hashSync(this.password, bcrypt.genSaltSync(10))
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
      const result = await collectionUser.repository.findOne({ where: { email }, order: { createdAt: 'ASC' } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUserByEmail. ' + error)
      return null
    }
  }

  public static findUserById = async (id: any) => {
    if (!id) return null

    try {
      const collectionUser = Collection.get('User') as CollectionUser
      const idStr = id._id ? id._id.toString() : id.toString()
      const result = await collectionUser.repository.findOne({ where: { id: idStr } })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUserById. ' + error)
      return null
    }
  }

  public static findUsersByStatus = async (fromPosition: number, usersMax: number, status: UserStatus, newestFirst: boolean = true) => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      let result = await collectionUser.repository.find({
        where: { status },
        skip: fromPosition,
        take: usersMax,
        order: { createdAt: newestFirst ? 'DESC' : 'ASC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findUsersByStatus. ' + error)
      return null
    }
  }

  public static findUsers = async (filter?: string, status?: string, fromPosition?: number, usersMax?: number, userRole?: UserRole): Promise<any> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      let qb = collectionUser.repository.createQueryBuilder('user')

      if (!!status && status.toLowerCase() !== 'all' && CollectionUser.isValidStatus(status)) {
        qb = qb.andWhere('user.status = :status', { status })
      }

      if (!!userRole) {
        qb = qb.andWhere('user.role = :role', { role: userRole })
      }

      if (filter != null && filter.length > 0) {
        qb = qb.andWhere(
          '(user.firstName ILIKE :filter OR user.lastName ILIKE :filter OR user.email ILIKE :filter OR user.role ILIKE :filter)',
          { filter: `%${filter}%` }
        )
      }

      qb = qb.orderBy('user.createdAt', 'DESC')

      if (fromPosition !== undefined && fromPosition >= 0) {
        qb = qb.skip(fromPosition)
      }

      if (usersMax !== undefined && usersMax > 0) {
        qb = qb.take(usersMax)
      }

      const results = await qb.getMany()
      return results
    } catch (error) {
      Collection.onError('Couldn\'t get users', 'Error on getting users. ' + error)
      return []
    }
  }

  public static findAllUsersByRole = async (userRole: UserRole): Promise<any> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      let result = await collectionUser.repository.find({
        where: { role: userRole },
        order: { createdAt: 'DESC' },
      })
      return result
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.findAllUsersByRole. ' + error)
      return null
    }
  }

  public static getAllUsersCount = async (filter?: string, status?: string, userRole?: UserRole): Promise<number> => {
    try {
      const collectionUser = Collection.get('User') as CollectionUser
      let qb = collectionUser.repository.createQueryBuilder('user')

      if (!!status && status.toLowerCase() !== 'all' && CollectionUser.isValidStatus(status)) {
        qb = qb.andWhere('user.status = :status', { status })
      }

      if (!!userRole) {
        qb = qb.andWhere('user.role = :role', { role: userRole })
      }

      if (filter != null && filter.length > 0) {
        qb = qb.andWhere(
          '(user.firstName ILIKE :filter OR user.lastName ILIKE :filter OR user.email ILIKE :filter OR user.role ILIKE :filter)',
          { filter: `%${filter}%` }
        )
      }

      const count = await qb.getCount()
      return count
    } catch (error) {
      console.warn('Couldn\'t complete CollectionUser.getAllUsersCount. ' + error)
      return 0
    }
  }

  public static findAllValidAdmins = (): Promise<any[]> =>
    CollectionUser.findUsers(undefined, UserStatus.Live, undefined, undefined, UserRole.Admin)
}
