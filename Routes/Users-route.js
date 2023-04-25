const express = require('express')
const { check } = require('express-validator')

//const HttpError = require('../models/http-error')

const usersControllers = require('../controllers/Users-controller')
const fileUpload=require('../Middleware/file-upload')
//const checkAuth=require('../Middleware/check-auth')
const router = express.Router();


router.get('/', usersControllers.getUser )
router.get('/:uid', usersControllers.getUser)
//router.use(checkAuth)
router.post('/signup',
fileUpload.single('image'), // this middleware extracts the img which comes from the front end
[
    check('name').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min : 6})
], 
usersControllers.signUp )
router.post('/login', usersControllers.login )








module.exports = router;