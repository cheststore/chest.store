export default [
  async function createCloudCredentialUserMap(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cloud_bucket_user_map (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bucket_id uuid REFERENCES cloud_buckets,
        user_id uuid REFERENCES users,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(bucket_id, user_id)
      );
    `)
  },

  async function createCredentialUserMapIndexes(postgres) {
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS cloud_bucket_user_map_user_id_idx on cloud_bucket_user_map (user_id)`)
  }
]
