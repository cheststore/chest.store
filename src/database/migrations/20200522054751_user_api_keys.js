export default [
  async function createUserApiKeys(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS user_api_keys (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id uuid REFERENCES users,
        is_active boolean NOT NULL DEFAULT true,
        key uuid NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },
]
