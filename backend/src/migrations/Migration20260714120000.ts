import { Migration } from '@mikro-orm/migrations';

export class Migration20260714120000 extends Migration {
  override up(): void {
    this.addSql(
      'create table "note" ("id" serial primary key, "subject" varchar(320) not null, "body" text not null, "created_at" timestamptz not null, "updated_at" timestamptz null);',
    );
    this.addSql('create index "note_subject_index" on "note" ("subject");');
  }

  override down(): void {
    this.addSql('drop table if exists "note";');
  }
}
