import assert from 'assert'
import SessionHandler from './SessionHandler'

describe('SessionHandler', () => {
  describe(`#getLoggedInUserId`, function() {
    it(`should get correct user information for who's logged in`, function() {
      const session = SessionHandler({ user: { id: 1, name: 'The User Name' }})

      assert.equal(1, session.getLoggedInUserId())
      assert.equal("The User Name", session.getLoggedInUserId(true).name)
    })
  })

  describe('#setSession', function() {
    it(`should set the data in the session recursively`, async function() {
      const sessionObj = { save: cb => cb() }
      const session = SessionHandler(sessionObj)
      await session.setSession({ lance: 1, nested: { ary: [1, 2, 3] }})
      assert.equal(1, sessionObj.lance)
      assert.equal(true, sessionObj.nested.ary instanceof Array)
      assert.equal(1, sessionObj.nested.ary[0])
      assert.equal(2, sessionObj.nested.ary[1])
      assert.equal(3, sessionObj.nested.ary[2])

      await session.setSession({ nested: { obj: 123 }, isNull: null })
      assert.equal(123, sessionObj.nested.obj)
      assert.equal(null, sessionObj.isNull)
    })
  })
})
