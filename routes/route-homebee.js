var express = require('express');
var router = express.Router();
var homebeeapi = require('../controllers/homebee-api-controller');

router.use('/register', homebeeapi.authorise, homebeeapi.register);
router.use('/login', homebeeapi.authorise, homebeeapi.login);
router.use('/user-devices', homebeeapi.authorise, homebeeapi.userDevices);
router.use('/ping', homebeeapi.authorise, homebeeapi.ping);

module.exports = router;
