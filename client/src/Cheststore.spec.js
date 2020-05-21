import assert from 'assert'
// import Vue from 'vue'
import Cheststore from './Cheststore.vue'

// Here are some Jasmine 2.0 tests, though you can
// use any test runner / assertion library combo you prefer
describe('Cheststore', function() {
  // Inspect the raw component options
  it('has a created hook', function() {
    assert.equal('function', typeof Cheststore.created)
  })

  // Evaluate the results of functions in
  // the raw component options
  // it('sets the correct default computed props', () => {
  //   const vm = new Vue(Cheststore).$mount()
  //   assert.equal('object', typeof vm.isLoading)
  //   assert.equal(true, vm.isLoading)
  // })

  // Mount an instance and inspect the render output
  // it('renders the correct message', () => {
  //   const Constructor = Vue.extend(Cheststore)
  //   const vm = new Constructor().$mount()
  //   expect(vm.$el.textContent).toBe('bye!')
  // })
})
