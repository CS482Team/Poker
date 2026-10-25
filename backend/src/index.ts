import "dotenv/config"
import { createServer } from "http"
import { app } from "./app"
import { initSocket } from "./socket/io"

const port = process.env.PORT
const server = createServer(app)
initSocket(server)
server.listen(port, () => console.log(`backend on :${port}`))
