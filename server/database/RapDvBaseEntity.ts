// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { BaseEntity, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export abstract class RapDvBaseEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  get _id(): string {
    return this.id
  }

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  toObject(): any {
    return { ...this }
  }
}
