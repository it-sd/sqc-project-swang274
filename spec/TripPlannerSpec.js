const request = require('supertest')
const app = require('../app')
const assert = require('node:assert/strict')

describe('GET /health', () => {
  it('should return a message indicating that the database connection is OK', (done) => {
    request(app)
      .get('/health')
      .expect((res) => {
        if (res.status < 200 || res.status >= 400) {
          throw new Error(`Unexpected status code: ${res.status}`)
        }
      })
      .expect('Content-Type', /text/)
      .end((err, res) => {
        if (err) return done(err)
        expect(res.text).toEqual('Database connection OK')
        done()
      })
  })
})

describe('GET /', () => {
  it('should return a message indicating success', (done) => {
    request(app)
      .get('/')
      .expect((res) => {
        if (res.status < 200 || res.status >= 400) {
          throw new Error(`Unexpected status code: ${res.status}`)
        }
      })
      .expect('Content-Type', /text/)
      .expect('Welcome to my Node.js application')
      .end((err, res) => {
        if (err) return done(err)
        done()
      })
  })
})
