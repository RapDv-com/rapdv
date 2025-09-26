// Copyright (C) Konrad Gadzinowski

import { Server } from "./server/Server"

const server = new Server(() => {
  const App = require("./../../../server/App").App
  const app = new App()
  return app
})
server.start()