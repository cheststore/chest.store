export default [
  async function createUserOauthTokens(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS user_oauth_tokens (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES users,
        type varchar(255),
        unique_id varchar(255),
        access_token varchar(2040),
        refresh_token varchar(2040),
        first_name varchar(255),
        last_name varchar(255),
        email varchar(255),
        expires timestamp,
        mod1 varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, type, unique_id)
      );
    `)
  },
]
