import express from "express"
import cors from "cors"
import { createServer } from "http"
import { Server } from "socket.io"

const app = express()
app.use(cors())
app.get("/health", (_, res) => res.json({ ok: true }))

const server = createServer(app)
new Server(server, { cors: { origin: "http://localhost:3000" } })
server.listen(4000, () => console.log("backend on :4000"))

