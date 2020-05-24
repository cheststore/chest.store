export default [
  async function createUsers(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        username varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255),
        email_address varchar(255) UNIQUE,
        first_name varchar(255),
        last_name varchar(255),
        current_credential_id uuid REFERENCES cloud_credentials,
        current_bucket_id uuid REFERENCES cloud_buckets,
        last_login timestamptz,
        two_factor_enabled boolean,
        two_factor_secret varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },
]
