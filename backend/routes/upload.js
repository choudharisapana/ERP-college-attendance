const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('../utils/cloudinary')

const storage = multer.memoryStorage()
const upload = multer({ storage })

// Upload file endpoint -> uploads to Cloudinary and returns secure_url
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if(!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // upload buffer to Cloudinary
    const result = await cloudinary.uploader.upload_stream({ folder: 'schedules' }, (err, r) => {
      if(err) throw err
      res.json({ url: r.secure_url })
    })

    // pipe buffer
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'schedules' },
      function(error, result){
        if(error) return res.status(500).json({error})
        return res.json({ url: result.secure_url })
      }
    )

    stream.end(req.file.buffer)

    } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

module.exports = router