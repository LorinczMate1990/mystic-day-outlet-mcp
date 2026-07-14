import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'email_note' })
@Index({ properties: ['subject'] })
export class EmailNote {
  @PrimaryKey()
  id!: number;

  @Property()
  subject!: string;

  @Property({ type: 'text' })
  body!: string;

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date(), nullable: true })
  updatedAt?: Date;
}
