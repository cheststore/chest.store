export default [
  async function createCloudBuckets(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS cloud_buckets (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        type varchar(20), -- 'aws', 'gcp', etc.
        bucket_uid varchar(255) NOT NULL,
        name varchar(255),
        description text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(type, bucket_uid)
      );
    `)
  }//,

  // async function createCloudBucketsIndexes(postgres) {
  //   await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS cloud_buckets_credential_id_idx on cloud_buckets (credential_id)`)
  // }
]
