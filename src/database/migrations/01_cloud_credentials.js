export default [
  async function createCloudCredentials(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cloud_credentials (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        type varchar(20), -- 'aws', 'gcp', etc.
        key varchar(255),
        secret varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(type, key)
      );
    `)
  }
]
