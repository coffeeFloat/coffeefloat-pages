const test = require('ava')
const coffeefloatPages = require('..')

// TODO: Implement module test
test('<test-title>', t => {
  const err = t.throws(() => coffeefloatPages(100), TypeError)
  t.is(err.message, 'Expected a string, got number')

  t.is(coffeefloatPages('w'), 'w@zce.me')
  t.is(coffeefloatPages('w', { host: 'wedn.net' }), 'w@wedn.net')
})
