export default [
  async function createCloudObjects(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cloud_objects (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bucket_id uuid REFERENCES cloud_buckets,
        full_path varchar(1000),
        directory_id uuid REFERENCES cloud_directories, -- null means top level of bucket
        name varchar(255),
        last_modified timestamptz,
        etag varchar(255),
        size_bytes integer,
        storage_class varchar(100),
        owner_id varchar(255),
        owner_display_name varchar(255),
        sha256_contents varchar(32),
        metadata jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(bucket_id, full_path)
      );
    `)
  },

  async function createCloudObjectsIndexes(postgres) {
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS cloud_objects_bucket_id_idx on cloud_objects (bucket_id)`)
  }
]
