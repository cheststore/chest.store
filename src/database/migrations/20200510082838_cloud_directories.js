export default [
  async function createCloudDirectories(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cloud_directories (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bucket_id uuid REFERENCES cloud_buckets,
        parent_directory_id uuid REFERENCES cloud_directories,  -- if null, it's top level, otherwise is under its parent
        full_path varchar(255),
        name varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(bucket_id, full_path)
      );
    `)
  },

  async function createCloudDirectoriesIndexes(postgres) {
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS cloud_directories_bucket_id_idx on cloud_directories (bucket_id)`)
  }
]
