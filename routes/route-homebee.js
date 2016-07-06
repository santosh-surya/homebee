var express = require('express');
var router = express.Router();
var homebeeapi = require('../controllers/homebee-api-controller');

router.use('/register', homebeeapi.authorise, homebeeapi.register);
router.use('/update', homebeeapi.authorise, homebeeapi.update);

module.exports = router;
