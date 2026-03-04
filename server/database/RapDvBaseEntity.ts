// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, CreatedAt, DataType, Default, Model, PrimaryKey, UpdatedAt } from 'sequelize-typescript'

export abstract class RapDvBaseEntity extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string

  get _id(): string {
    return this.id
  }

  @CreatedAt
  createdAt: Date

  @UpdatedAt
  updatedAt: Date

  toObject(): any {
    return this.get({ plain: true })
  }

  async remove(): Promise<void> {
    await this.destroy()
  }
}
