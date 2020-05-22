export default [
  async function createUserApiKeys(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        credential_id uuid REFERENCES cloud_credentials,
        bucket_id uuid REFERENCES cloud_buckets,
        user_id uuid REFERENCES users,
        key uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(credential_id, bucket_id, user_id)
      );
    `)
  },

  async function createUserApiKeysIndexes(postgres) {
    await postgres.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS user_api_keys_credential_id_idx on user_api_keys (credential_id)`
    )
  },
]
