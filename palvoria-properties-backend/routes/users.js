import express from 'express'

const router = express.Router()

router.get('/', (req, res) => {
  res.json({ message: 'Users routes - to be implemented' })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'User details route - to be implemented' })
})

router.put('/:id', (req, res) => {
  res.json({ message: 'Update user route - to be implemented' })
})

export default router