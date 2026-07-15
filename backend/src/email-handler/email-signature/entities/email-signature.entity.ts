import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'email_signature' })
export class EmailSignature {
  @PrimaryKey()
  id!: number;

  @Property({ type: 'text' })
  textBody!: string;

  @Property({ type: 'text', nullable: true })
  htmlBody?: string;

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
