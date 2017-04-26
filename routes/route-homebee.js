var express = require('express');
var router = express.Router();
var homebeeapi = require('../controllers/homebee-api-controller');

router.use('/device/register', homebeeapi.authorise, homebeeapi.register);
router.use('/login', homebeeapi.authorise, homebeeapi.login);
router.use('/user-devices', homebeeapi.authorise, homebeeapi.userDevices);
router.use('/device/ping', homebeeapi.authorise, homebeeapi.ping);
router.use('/device/update', homebeeapi.authorise, homebeeapi.update);
router.use('/device/device-command-update', homebeeapi.authorise, homebeeapi.deviceCommandUpdate);
router.use('/add-command', homebeeapi.authorise, homebeeapi.addCommand);
router.use('/upload-firmware', homebeeapi.authorise, homebeeapi.uploadFirmware);

module.exports = router;
