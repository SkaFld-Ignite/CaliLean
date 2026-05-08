import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260507180000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'ALTER TABLE "qr_campaign" ADD COLUMN IF NOT EXISTS "variant_id" text NULL;'
    )
  }

  async down(): Promise<void> {
    this.addSql('ALTER TABLE "qr_campaign" DROP COLUMN IF EXISTS "variant_id";')
  }
}
