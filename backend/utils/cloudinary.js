const cloudinary = require('cloudinary').v2

// Configure Cloudinary using env variables (replace with your own in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // /* FILL YOUR OWN */
  api_key: process.env.CLOUDINARY_API_KEY, // /* FILL YOUR OWN */
  api_secret: process.env.CLOUDINARY_API_SECRET // /* FILL YOUR OWN */
})

module.exports = cloudinary