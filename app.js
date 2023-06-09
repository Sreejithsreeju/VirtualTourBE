const express = require('express')
const mongoose = require('mongoose')
const fs=require('fs')
const path=require('path')

//const bodyParser = require('body-parser')

const HttpError = require('./models/http-error')
const usersRoute = require('./Routes/Users-route')
const placesRoute = require('./Routes/Places-route')


const app = express()
app.use(express.json()) // body-parser

app.use('/uploads/images', express.static(path.join('uploads','images')))
app.use((req,res,next) =>{

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')

    next()
})

app.use('/api/users',usersRoute)
app.use('/api/places',placesRoute)
app.use((req,res,next) => {
   const error = new HttpError('Could not find the route',404)
   throw error
})


    
app.use((error,req,res,next) => {
    if(req.file){
        fs.unlink(req.file.path,err=>{
            console.log(err)
        })
    }


    if(res.headerSent){
        return next(error)
    }

    res.status(error.code || 500)
    res.json({message: error.message || 'An unknown error occured'})
})



mongoose.connect('mongodb+srv://Virtualtour:virtualtour@cluster0.4az5lwb.mongodb.net/places?retryWrites=true&w=majority')
.then(
    () => {
        app.listen(5000)
    }
).catch( err => {
    console.log(err)
})



