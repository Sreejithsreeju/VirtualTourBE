const express = require("express");

//const HttpError = require('../models/http-error')

const { check } = require("express-validator");
const fileUpload=require('../Middleware/file-upload')

const placesControllers = require("../controllers/Places-controller");
const checkAuth = require("../Middleware/check-auth");

const router = express.Router();

router.get("/:pid", placesControllers.getPlaceByPlaceId);

router.get('/user/:uid', placesControllers.getPlacesByUserId)
router.use(checkAuth)
router.post(
  "/",
  fileUpload.single('image'),
  [
    check('title').not().isEmpty(),
    check('description').isLength({ min:5}),
    check('address').not().isEmpty()
],
  placesControllers.createPlace
);

router.patch("/:pid",
fileUpload.single('image'),
 [
    check('title').not().isEmpty(),
    check('description').isLength({ min:5}),
], placesControllers.updatePlace);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
