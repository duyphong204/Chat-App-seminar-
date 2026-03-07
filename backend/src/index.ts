import 'dotenv/config'
import express, { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { Env } from './config/env.config'
import { asyncHandler } from './middlewares/asyncHandler.middleware'
import { HTTPSTATUS } from './config/http.config'
import { errorHandler } from './middlewares/errorHandler.middleware'
import connecDB from './config/database.config'
import passport, { initialize } from 'passport'
import './config/passport.config'
import http from "http";
import { initializeSocket } from './lib/socket'
import routes from './routes'


const app = express()
const server = http.createServer(app);

// socket 
initializeSocket(server)

app.use(express.json({ limit: "10mb" }))
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(cors({
  origin: Env.FRONTEND_ORIGIN,
  credentials: true
}))

app.use(passport.initialize())
app.use('/api', routes)

app.use(errorHandler)

server.listen(Env.PORT, async () => {
  await connecDB()
  console.log(`server running ${Env.PORT}`)
})