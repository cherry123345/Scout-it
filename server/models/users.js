const mongoose = require('mongoose'); 
const { type } = require('os');


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, unique: true },
    roles: { type: String, required: true}
  });

const users = mongoose.model('users', userSchema ) 
module.exports = users 