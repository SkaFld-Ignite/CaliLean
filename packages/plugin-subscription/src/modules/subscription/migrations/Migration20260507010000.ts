import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260507010000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'create table if not exists "subscription_config" ("id" text not null, "discount_rate" real not null default 0.115, "display_label" text not null default \'11.5%\', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_config_pkey" primary key ("id"));'
    )
    this.addSql(
      "insert into \"subscription_config\" (\"id\", \"discount_rate\", \"display_label\") values ('default', 0.115, '11.5%') on conflict do nothing;"
    )
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "subscription_config" cascade;')
  }
}
