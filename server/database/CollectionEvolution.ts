// Copyright (C) Konrad Gadzinowski

import 'reflect-metadata'
import { Column, Entity } from 'typeorm'
import { RapDvBaseEntity } from './RapDvBaseEntity'
import { Collection } from './Collection'

@Entity('evolutions')
export class Evolution extends RapDvBaseEntity {
  @Column({ nullable: true })
  number: number

  @Column({ nullable: true, type: 'text' })
  comments: string

  @Column({ nullable: true, type: 'timestamptz' })
  date: Date
}

export class CollectionEvolution extends Collection {
  constructor() {
    super('Evolution', Evolution)
  }
}
