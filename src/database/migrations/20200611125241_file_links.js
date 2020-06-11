export default [
  async function createFileLinks(postgres) {
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS file_links (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        bucket_id uuid REFERENCES cloud_buckets,
        entity_table varchar(255),
        entity_id uuid,
        entity_identifying_info varchar(255),
        expiration_date timestamptz,
        password varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `)
  },

  async function createFileLinksIndexes(postgres) {
    await postgres.query(
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS file_links_entity_table_entity_id_idx on file_links (entity_table, entity_id)`
    )
  },
]
