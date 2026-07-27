import { buildApp } from '../src/app.js'

let app

export default async (req, res) => {
  if (!app) {
    app = await buildApp()
  }
  await app.ready()
  app.server.emit('request', req, res)
}
