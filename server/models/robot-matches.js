const mongoose = require('mongoose'); 
const { type } = require('os');

// Function to create a new collection for matches
const createMatchCollection = (teamNum) => {
    const matchSchema = new mongoose.Schema({
        TeamNum: {
            type: Number,
        },
        MatchNo: {
            type: Number,
        },
        SpeakerNotes: {
            type: Number,
        },
        AmpNotes: {
            type: Number,
        },
    });

    // Create a new model for the matches collection
    return mongoose.model(`Team_${teamNum}_Matches`, matchSchema);
};

module.exports = createMatchCollection;