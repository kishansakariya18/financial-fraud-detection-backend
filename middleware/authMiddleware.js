const jwt = require('jsonwebtoken')
const userRepository = require('../repositories/user.repository')
const isValidUser  = async (req, res, next) => {
    try {
        const authToken = req.headers['authorization']

        console.log('authToken: ', authToken);
        
        if(!authToken){
            return res.status(401).json({message: "Unauthorized"})
        }
        const token = authToken.split(' ')[1]
        const decoded = await jwt.verify(token, process.env.JWT_SECRET)

        console.log('decoded: ', decoded);
        
        const user = await userRepository.findById(decoded.id)

        console.log('user: ', user);
        

        if(!user){

            console.log('user not found');
            
            throw new Error("Unauthorized")
        }
        req.user = user
        return next()
    } catch (error) {
        console.log('auth catch error : ', error);
        

        return res.status(401).json({message: "Unauthorized"})
    }
}

module.exports = { isValidUser }