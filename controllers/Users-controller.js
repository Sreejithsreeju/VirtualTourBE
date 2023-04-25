//const uuid = require('uuid')
const { validationResult} = require('express-validator')
const HttpError = require('../models/http-error');
//const Place = require('../models/Place');

const User = require('../models/User')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')


// const DUMMY_USERS = [
//     {
//         id : 'u1',
//         name : 'sreejith',
//         email : 'sreejith@gmail.com',
//         password : 'sreejith'
//     }
// ]

const getUser = async (req,res,next) => {
    // res.json({users : DUMMY_USERS})
    const userId = req.params.uid 

    let user
    try{
        if(userId){
     user = await User.findById(userId)}
     else{
       // user = await User.find({}, 'name email places image')
        user = await User.find({creator:userId})
     }
    } catch(err){
        const error = new HttpError('Fetching user failed, please try again later', 500);
        return next(error)
    }

    if(  user.length === 0){
       
        return next(new HttpError('Could not find the user for the provided user id', 404))
    }
    if(userId){
        res.json({ user:user.toObject({ getters : true })})
    }
    else{
    res.json({user : user.map(user => user.toObject({ getters : true }))})
}
}

    
// const getUser = async (req,res,next) => {
//     // res.json({users : DUMMY_USERS})
//     let users;
//     try{
//       users = await User.find({}, 'name email')
//     }catch(err){
//         const error = new HttpError('Fetching users failed..', 500);
//         return next(error);
//     }

//     res.json({users : users.map(user => user.toObject({ getters : true }))})
// }

// const getUsersByUserId = async(req,res,next)=>{ // /api/user/uid
//     const userId = req.params.uid 
//     // const users = DUMMY users.filter( p => {
//     //     return p.creator === userId
//     // })
//     console.log(userId)
//     let user
//     try{
//      user = await User.findById(userId)
//     } catch(err){
//         const error = new HttpError('Fetching user failed, please try again later', 500);
//         return next(error)
//     }

//     if(  user.length === 0){
       
//         return next(new HttpError('Could not find the user for the provided user id', 404))
//     }
//     res.json({ user:user.toObject({ getters : true })})
   

// }

const signUp = async (req,res,next) => {
    const error = validationResult(req)

    if(!error.isEmpty()){
       return next(
            new HttpError('Invalid Input, please check your data', 422)
        ) 
    }
    const { name, email, password } = req.body

   // const hasUser = DUMMY_USERS.find(u => u.email === email)

    // if(hasUser){
    //     throw new HttpError("Username already exists. Please try with another one", 422)
    // }

    let existingUser;

    try{
        existingUser = await User.findOne({ email : email})
    } catch(err){
        const error = new HttpError('Signing up failed, please try again later', 500)
        return next(error)
    }

    if(existingUser){
        const error = new HttpError('User already exists, please try to login,', 422)
        return next(error)
    }

    // const createdUser = {
    //     id : uuid.v4(),
    //     name,
    //     email,
    //     password
    // }
    let hashedPassword;

    try {
  
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      const error = new HttpError("Could not create user, please try again", 500);
      return next(error);
    }
    const createdUser = new User({
        name,
        email,
        password:hashedPassword,
        image : req.file.path,
     users : []
    })

    // DUMMY_USERS.push(createdUser)
console.log(createdUser)
    try{
        await createdUser.save()
    } catch(err){
        const error = new HttpError('Signing up Failed. Please try again', 500)
        return next(error)
    }
    let token;

  try{
    token = jwt.sign(
        { userId: createdUser.id, email: createdUser.email },
         "soft_secret_password",
        { expiresIn: "1m" }
      );
    
  }catch(err){
    const error = new HttpError("Signing up Failed. Please try again", 500);
    return next(error)
  }
  
 // res.status(201).json({ user: createdUser.toObject({ getters: true }) });
  res.status(201).json({ userId : createdUser.id, email : createdUser.email, token});
}

const login = async (req,res,next) => {
    const { email, password} = req.body

    // const identifiedUser = DUMMY_USERS.find(u => u.email === email)
    // if(!identifiedUser || identifiedUser.password !== password){
    //    throw new HttpError("Invalid Username/Password", 401)
    // }

    let existingUser;

    try{
        existingUser = await User.findOne({ email : email})
    } catch(err){
        const error = new HttpError('Login failed, please try again later', 500)
        return next(error)
    }

    // if(!existingUser || existingUser.password !== password){
        if(!existingUser){
        const error = new HttpError('Invalid credentials, could not log you in,', 422)
        return next(error)
    }
    let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError("Oops... something went wrong", 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in,",
      422
    );
    return next(error);
  }
  let token;

  try{
     token=jwt.sign( 
        {userId: existingUser.id,email:existingUser.email},
        "soft_secret_password",
        { expiresIn: "1h" }
      );
    
  }catch(err){
    const error = new HttpError("Signing up Failed. Please try again", 500);
    return next(error)
  }
  
  res.json({userId:existingUser.id,email:existingUser.email,token});


//     res.json({message : "Logged in Successfully",user:existingUser.toObject({ getters : true})})
 }

exports.getUser = getUser;
exports.signUp = signUp;
exports.login = login;
//exports.getUsersByUserId = getUsersByUserId;