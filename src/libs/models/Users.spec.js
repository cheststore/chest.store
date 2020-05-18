import '../../tests/spec_helper'

// import path from 'path'
import assert from 'assert'
import PostgresClient from '../PostgresClient'
import Users from './Users.js'

const postgresUrl =
  process.env.DATABASE_TEST_URL || 'postgres://localhost:5432/cheststore_test'

const pg = new PostgresClient(postgresUrl)
const users = Users(pg)

describe('Users', function () {
  describe('#setSession', function () {
    it('should set key/value pairs in the session', async function () {
      const session1 = {
        save: function (cb) {
          this.num_saves++
          cb()
        },
        num_saves: 0,
        test_key: 'test_val',
      }
      const session2 = {
        save: function (cb) {
          this.num_saves++
          cb()
        },
        num_saves: 0,
        test_key: 'test_val',
      }
      const usersWithSession1 = Users(pg, session1)
      const usersWithSession2 = Users(pg, session2)
      const shouldBeFalse = await users.setSession({})
      const result1 = await usersWithSession1.setSession({ my_key: 'my_val' })
      const result2 = await usersWithSession2.setSession({
        obj1: { obj2: { my_val: 'lance' } },
      })

      assert.equal(false, shouldBeFalse)
      assert.equal(true, result1)
      assert.equal(true, result2)

      assert.equal(1, session1.num_saves)
      assert.equal('my_val', session1.my_key)

      assert.equal(3, session2.num_saves)
      assert.equal('[object Object]', session2.obj1.toString())
      assert.equal('lance', session2.obj1.obj2.my_val)
    })
  })
})
