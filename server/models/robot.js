const mongoose = require('mongoose'); 
const { type } = require('os');

const RobotSchema = new mongoose.Schema({ 


    TeamNum: {
        type: Number, 
        required: true,
        unique: true,
    }, 

    TeamName: { 
        type: String, 
    }, 

    RobotName: { 
        type: String, 
    }, 

    RobotImage: {
        type: Buffer,
    },

    ///////Pit scout///////
    
    Weight: {
        type: Number
    },
    FrameSize: {
        type: String
    },
    Drivetrain: {
        type: String
    },
    ScorePlace: {
        type: String
    },
    AdjustableShooter: {
        type: String
    },
    ClimbAndTrap: {
        type: String
    },
    AutoStrats: {
        type: String
    },
    SpecialfeaturesAndLimitations: {
        type: String
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
RobotSchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

RobotSchema.pre('findOneAndUpdate', function(next) {
    this.set({ lastUpdated: Date.now() });
    next();
  });
  

const Robot = mongoose.model('Robot', RobotSchema ) 
module.exports = Robot 

 