import assert from 'assert'
import PostgresClient from './PostgresClient'

const postgresUrl = process.env.DATABASE_TEST_URL || 'postgres://localhost:5432/risk3sixty_test'
const postgres = new PostgresClient(postgresUrl)

describe('PostgresClient', function() {
  describe('#query', function() {
    it(`should query the database and return rows`, async function() {
      const { rows } = await postgres.query('select 1 as col')
      assert.equal(true, rows instanceof Array)
      assert.equal(1, rows.length)
      assert.equal('col', Object.keys(rows[0])[0])
      assert.equal(1, rows[0]['col'])
    })
  })

  describe('#queryStream', function() {
    it(`should query the database through a stream and individual rows should be processed in a callback`, async function() {
      let rows = []
      await postgres.queryStream('select 1 as col', row => rows.push(row))
      await postgres.queryStream('select 2 as col2', row => rows.push(row))

      assert.equal(true, rows instanceof Array)
      assert.equal(2, rows.length)
      assert.equal('col', Object.keys(rows[0])[0])
      assert.equal(1, rows[0]['col'])
      assert.equal(2, rows[1]['col2'])
    })
  })

  describe('#dropTableCascadeAndDropDependentTables', function() {
    before(`create test tables`, async function() {
      await postgres.query(`create table test1 (id integer primary key)`)
      await postgres.query(`create table test2 (id integer primary key, t1ref integer REFERENCES test1, col1 integer)`)
      await postgres.query(`create table test3 (id integer primary key, t2ref integer REFERENCES test2, col1 integer)`)
    })

    it(`should drop the table and all dependent tables without errors`, async function() {
      const table1Exists = await postgres.query(`select * from information_schema.columns where table_name = 'test1'`)
      const table2Exists = await postgres.query(`select * from information_schema.columns where table_name = 'test2'`)
      const table3Exists = await postgres.query(`select * from information_schema.columns where table_name = 'test3'`)
      assert.equal(true, table1Exists.rows.length > 0)
      assert.equal(true, table2Exists.rows.length > 0)
      assert.equal(true, table3Exists.rows.length > 0)

      const allTablesDropped = await postgres.dropTableCascadeAndDropDependentTables('test1')
      assert.equal(3, allTablesDropped.length)
      assert.equal(true, allTablesDropped.includes('test1'))
      assert.equal(true, allTablesDropped.includes('test2'))
      assert.equal(true, allTablesDropped.includes('test3'))

      const table1NotExists = await postgres.query(`select * from information_schema.columns where table_name = 'test1'`)
      const table2NotExists = await postgres.query(`select * from information_schema.columns where table_name = 'test2'`)
      const table3NotExists = await postgres.query(`select * from information_schema.columns where table_name = 'test3'`)
      assert.equal(false, table1NotExists.rows.length > 0)
      assert.equal(false, table2NotExists.rows.length > 0)
      assert.equal(false, table3NotExists.rows.length > 0)
    })
  })
})
