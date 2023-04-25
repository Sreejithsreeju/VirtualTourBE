const HttpError = require('../models/http-error')
const { validationResult} = require('express-validator')
const mongoose = require('mongoose')
const fs=require('fs')

//const uuid = require('uuid')

const getcoords = require('../utils/Location')

const Place = require('../models/Place')
const User = require('../models/User')

// let DUMMY_PLACES = [
//     {
//         id:'p1',
//         title:'Palakkad Fort',
//         description:"Built by Hyder Ali",
//         location:{
//             lat:10.7637057,
//             lng: 76.6549328
//         },
//         address:'QM74+FRQ, Palakkad-Koduvayur, Thathamangalam-Meenakshipuram Highway, Kenathuparambu, Kunathurmedu, Palakkad, Kerala 678001',
//         creator:'u1'
//     }
// ]

const getPlaceByPlaceId = async (req,res,next)=>{ // /api/places/pid
    const placeId = req.params.pid 
    // const place = DUMMY_PLACES.find( p => {
    //     return p.id === placeId
    // })
    console.log(placeId)
    let place;
    try{
         place = await Place.findById(placeId)
    } catch(err){
        const error = new HttpError("Something wnet wrong, could not find a place",500);
        return next(error)
    }
    if(!place){
        //return res.json({message:"Place not found"})
       // return res.status(404).json({message : " Could not find a place for the provided place id"})

        // const error = new Error('Could not find a place for the provided place id')
        // error.code = 404
        // throw error

        throw new HttpError("Could not find a place for the provided place id", 404)
    }
    res.json({place : place.toObject({ getters : true})})
}

const getPlacesByUserId = async(req,res,next)=>{ // /api/user/uid
    const userId = req.params.uid 
    // const places = DUMMY_PLACES.filter( p => {
    //     return p.creator === userId
    // })
    let places
    try{
     places = await Place.find({creator : userId})
    } catch(err){
        const error = new HttpError('Fetching places failed, please try again later', 500);
        return next(error)
    }

    if(!places || places.length === 0){
        //return res.json({message:"Place not found"})
        //return res.status(404).json({message : " Could not find a place for the provided user id"})

        // const error = new Error('Could not find a place for the provided user id')
        // error.code = 404
        return next(new HttpError('Could not find a place for the provided user id', 404))
    }
    res.json({places : places.map(place=> place.toObject({ getters : true}))})
    //res.json({place : place.toObject({ getters : true})})
}

const createPlace = async (req,res,next) => {
    const error = validationResult(req)

    if(!error.isEmpty()){
         return next(new HttpError('Invalid Input, please check your data', 422)) 
    }

    // const {title, description, address, creator} = req.body

    // let coordinates;
    // //try{
    //  coordinates = getcoords()
    //  console.log(coordinates)
    // }catch(error){
    //     return next(error)
    // }
    

    const {title, description, address, creator} = req.body

    let coordinates;
    try{
     coordinates = await getcoords(address)
     console.log(coordinates)
    }catch(error){
        return next(error)
    }

    // const createdPlace = {
    //     id : uuid.v4(),
    //     title,
    //     description,
    //     coordinates,
    //     address,
    //     creator
    // }
    const createdPlace = new Place({
        title,
        description,
        address,
        location : coordinates,
        image : req.file.path,
        creator
    })

    let user;

    try{
        user = await User.findById(creator)
    } catch(err){
        const error = new HttpError('Creating place failed', 500)
        return next(error)
    }
console.log(user)
    if(!user){
        const error = new HttpError('Could not fnd user for provided id', 404)
        return next(error)
    }

    

    // DUMMY_PLACES.push(createdPlace);

    try{
        //await createdPlace.save()

        const session = await mongoose.startSession();
        session.startTransaction();
        await createdPlace.save({ session : session});
        user.places.push(createdPlace);
        await user.save({ session : session});
        await session.commitTransaction();
    } catch(err){
        const error = new HttpError('Place cannot be saved. Please try again', 500)
        return next(error)
    }

    res.status(201).json({place : createdPlace}) 
}

const updatePlace = async (req, res, next) => {

    const error = validationResult(req)

    if(!error.isEmpty()){
        return next( new HttpError('Invalid Input, please check your data', 422))
    }

    const {title,description} = req.body
    const placeId = req.params.pid;
    
   // const updatedPlace = DUMMY_PLACES.find(p => p.id === placeId) ;
    //const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
    let place
    try{
       place =  await Place.findById(placeId);
    }catch(err){
        const error = new HttpError("Something went wrong, couldn't update the place", 500)
        next(error)
    }
    if(place.creator.toString() !== req.userData.userId){
        const error=new HttpError("You are not supposed to update place",401)
        return next(error)
    }
    place.title = title;
    place.description = description;

    try{
        await place.save()
    }catch(err){
        const error = new HttpError("Updation failed", 422)
    }
    
    // DUMMY_PLACES[placeIndex] = updatedPlace;
    
    res.status(200).json({place : place.toObject({ getters : true})})
    
    }

const deletePlace = async(req, res, next) => {
    const placeId = req.params.pid
    // if(!DUMMY_PLACES.find(p => p.id === placeId)){
    //     throw new HttpError('Could not find a place for the provided id', 404)
    // }
    // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId)
    let place;
    try{
        place = await Place.findById(placeId).populate('creator')
    }catch(err){
        const error = new HttpError("Coudn't delete the place", 500)
    }

    if(!place){
        const error = new HttpError('Could not find the place for this id', 404);
        return next(error);
    }
       const filePath=place.image;
    try{
        //await place.remove()

        const session = await mongoose.startSession();
        session.startTransaction();
        await place.remove({ session : session});
        place.creator.places.pull(place);
        await place.creator.save({ session : session});
        await session.commitTransaction();
    }catch(err){
        const error = new HttpError("Unable to find the place", 422)
    }
    fs.unlink(filePath,err=>{
        console.log(err)
    })

    res.json({message : 'Place Deleted Successfully'})

}

exports.getPlaceByPlaceId = getPlaceByPlaceId
exports.getPlacesByUserId = getPlacesByUserId
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;


