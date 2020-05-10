import assert from 'assert'
import { arrayGroupBy } from './Helpers'

describe('Helpers', function() {
  describe('#arrayGroupBy', function() {
    it(`should convert array to object grouped by items that match the mapper`, function() {
      const ary = [{ i: 1 }, { i: 2 }, { i: 2 }, { i: 3 }, { i: 3 }, { i: 3 }]
      const mapper = x => x.i

      const grouped = arrayGroupBy(ary, mapper)
      Object.keys(grouped).forEach(num => {
        assert.equal(parseInt(num), grouped[num].length)
      })
    })
  })
})
