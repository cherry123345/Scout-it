const mongoose = require('mongoose');

const createMatchCollection = (teamNum) => {
    const modelName = `Team_${teamNum}_Matches`;
    if (mongoose.models[modelName]) {
        return mongoose.model(modelName);
    }

    const matchSchema = new mongoose.Schema({
        MatchNo: {
            type: Number,
            unique: true,
        },
        SpeakerNotes: {
            type: Number,
        },
        AmpNotes: {
            type: Number,
        },
        PassedNotes: {
            type: Number,
        },
        AutoNotes: {
            type: Number,
        },
        Climb: {
            type: String,
        },
        Trap: {
            type: String,
        },
        WinLoss:{
            type: String,
        },
        AdditionalNotes: {
            type: String,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
        lastUpdatedBy: {
            type: String
        }
    });

    // Middleware to update `lastUpdated` field before each save
    matchSchema.pre('save', function(next) {
        this.lastUpdated = Date.now();
        next();
    });

    matchSchema.pre('findOneAndUpdate', function(next) {
        this.set({ lastUpdated: Date.now() });
        next();
    });
    
    return mongoose.model(modelName, matchSchema);
};

module.exports = createMatchCollection;