import "dotenv/config"
import { createServer } from "http"
import { Server } from "socket.io"
import { app } from "./app"

const server = createServer(app)
new Server(server, { cors: { origin: "http://localhost:3000" } })
server.listen(4000, () => console.log("backend on :4000"))

