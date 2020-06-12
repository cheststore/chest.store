export default [
  async function createAppBanners(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS app_banners (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        banner_html text,
        is_active BOOLEAN NOT NULL default true,
        priority integer NOT NULL DEFAULT 1, -- lower number means higher priority
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },
]
