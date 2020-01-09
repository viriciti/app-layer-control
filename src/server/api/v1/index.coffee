{ Router } = require "express"

router = Router()

router.use "/administration", require "./administration"
router.use "/devices", require "./devices"

module.exports = router
