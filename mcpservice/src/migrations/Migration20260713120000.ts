import { Migration } from '@mikro-orm/migrations';

export class Migration20260713120000 extends Migration {
  override up(): void {
    this.addSql(
      'create table "email_signature" ("id" serial primary key, "text_body" text not null, "html_body" text null, "updated_at" timestamptz not null);',
    );
  }

  override down(): void {
    this.addSql('drop table if exists "email_signature";');
  }
}
