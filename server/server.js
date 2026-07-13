import express from "express";
import dotenv from "dotenv";
import cors from 'cors';
import dbconnection from './config/db.js';
import mongoose from "mongoose";
dotenv.config()
const app=express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    message: dbReady ? 'Server is healthy' : 'Database not connected — start MongoDB on localhost:27017',
    mongo: dbReady ? 'connected' : 'disconnected',
  })
})
const port = process.env.PORT || 4000

const startServer = async () => {
  try {
    await dbconnection()
    app.listen(port, () => console.log(`Server listening on port ${port}`))
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`)
    process.exit(1)
  }
}

startServer()
