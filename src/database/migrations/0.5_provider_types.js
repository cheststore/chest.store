export default [
  async function createProviderTypes(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS provider_types (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        value varchar(255) NOT NULL UNIQUE,
        text varchar(255),
        img_icon_path varchar(255),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },

  async function seedProviderTypes(postgres) {
    const { rows } = await postgres.query(
      'select * from provider_types limit 1'
    )
    if (rows.length > 0) return

    await postgres.query(`
      INSERT INTO provider_types (value, text, img_icon_path)
      VALUES
      ('aws', 'AWS (Amazon Web Services)', '/public/img/vendors/aws_logo.png'),
      ('fs', 'File System', '/public/img/fs.png')
    `)
  },
]
