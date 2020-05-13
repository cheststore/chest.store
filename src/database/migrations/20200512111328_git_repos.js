export default [
  async function createGitRepos(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS git_repos (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        credential_id uuid REFERENCES cloud_credentials,
        bucket_id uuid REFERENCES cloud_buckets,
        object_id uuid REFERENCES cloud_objects,
        user_id uuid REFERENCES users,
        repo varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(bucket_id, repo)
      );
    `)
  },

  async function createGitReposIndexes(postgres) {
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS git_repos_credential_id_idx on git_repos (credential_id)`)
  }
]
