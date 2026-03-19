// ============================================================================
// LoveMarket Backend Server
// ============================================================================
import express from 'express'
import cors from 'cors'
import { prisma } from './utils/db.js'
import { startTickScheduler } from './engine/tickSystem.js'
import authRoutes from './routes/auth.js'
import marketRoutes from './routes/market.js'

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}))
app.use(express.json())

// ─── Request logger ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
})

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/market', marketRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'LoveMarket API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

// ─── Error handler ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// ─── Start server ────────────────────────────────────────────────────────────
async function start() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✓ Database connected')

    // Start tick scheduler (daily, hourly cron jobs)
    startTickScheduler()
    console.log('✓ Tick scheduler started')

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════╗
║         LoveMarket API Server            ║
║                                          ║
║   http://localhost:${PORT}                  ║
║                                          ║
║   Routes:                                ║
║   POST /api/auth/signup                  ║
║   POST /api/auth/login                   ║
║   GET  /api/auth/me                      ║
║   GET  /api/market/profiles              ║
║   GET  /api/market/profile/:id           ║
║   POST /api/market/trade                 ║
║   POST /api/market/close/:positionId     ║
║   GET  /api/market/portfolio             ║
║   GET  /api/market/history               ║
║   GET  /api/market/ticker                ║
║   GET  /api/market/news                  ║
║   GET  /api/health                       ║
╚══════════════════════════════════════════╝
      `)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

start()
