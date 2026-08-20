import test from 'node:test'
import assert from 'node:assert/strict'

import { displayUzPhone, isUzPhone, normalizeUzPhone } from '../src/phone.js'
import { normalizeMe } from '../src/api/normalize.js'

test('Uzbek phone spellings converge to the checkout identity key', () => {
  for (const value of ['90 123 45 67', '0 90 123 45 67', '+998 (90) 123-45-67']) {
    assert.equal(normalizeUzPhone(value), '998901234567')
    assert.equal(isUzPhone(value), true)
  }
  assert.equal(isUzPhone('+998 90 123 45'), false)
  assert.equal(displayUzPhone('998901234567'), '+998 90 123 45 67')
})

test('customer normalization preserves explicit checkout readiness', () => {
  const customer = normalizeMe({
    id: 3,
    telegram_id: 44,
    first_name: 'Aziza',
    last_name: 'Karimova',
    name: 'Aziza Karimova',
    phone: '998901234567',
    language: 'uz',
    profile_complete: true,
    profile_missing: [],
  })
  assert.equal(customer.firstName, 'Aziza')
  assert.equal(customer.lastName, 'Karimova')
  assert.equal(customer.profileComplete, true)
  assert.deepEqual(customer.profileMissing, [])
})
