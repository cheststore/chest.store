import path from 'path'
import assert from 'assert'
import Encryption from './Encryption.js'

describe('Encryption', function() {
  const originalText = 'test123'

  describe('#stringToHash()', function() {
    it(`should hash string without issue`, () => {
      const hash = Encryption.stringToHash(originalText)
      assert.equal(typeof hash, 'string')
    })
  })

  describe('#fileToHash()', function() {
    it(`should hash file contents without issue`, async () => {
      const hash = await Encryption.fileToHash(path.join(__dirname, 'Encryption.js'))
      assert.equal(typeof hash, 'string')
    })
  })

  describe('#hashPassword() and #comparePassword()', function() {
    let plainPassword = 'test123'
    let hashedPassword

    it(`hashPassword should hash a password as expected`, async () => {
      hashedPassword = await Encryption.hashPassword(plainPassword)
      assert.equal(true, plainPassword != hashedPassword)
      assert.equal(true, hashedPassword.length > 0)
    })

    it(`comparePassword should compare hash with plain password correctly`, async () => {
      const matches = await Encryption.comparePassword(plainPassword, hashedPassword)
      assert.equal(true, matches)
    })
  })
})
