{ Router } = require "express"

router = Router()

router.use "/administration", require "./administration"

module.exports = router
