const mongoose = require('mongoose');

const prioritySchema = new mongoose.Schema({
    priorityNum: Number,
    teamNum: Number, // Reference to the team number
});

const Priority = mongoose.model('priorities', prioritySchema ) 
module.exports = Priority 