export default [
  async function createAuditLog(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        credential_id uuid REFERENCES cloud_credentials,
        user_id uuid REFERENCES users,
        ip_address varchar(255),
        action varchar(255),
        entity_table varchar(255),
        entity_id uuid,
        additional_info text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },

  async function createAuditLogIndexes(postgres) {
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_credential_id_idx on audit_log (credential_id)`)
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_user_id_idx on audit_log (user_id)`)
    await postgres.query(`CREATE INDEX CONCURRENTLY IF NOT EXISTS audit_log_entity_table_id_idx on audit_log (entity_table, entity_id)`)
  }
]
