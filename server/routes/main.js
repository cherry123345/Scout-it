const express = require('express');
const router = express.Router();
const Robot = require('../models/robot');
const multer = require('multer');
const MatchCollection = require('../models/robot-matches');
const mongoose = require('mongoose')

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//get methods
//get method that renders index page
router.get('', async (req, res) => {
    const locals = {
        title: "Scout-It",
    }
    const messages = {
        error: req.flash('error')
    };
    try{
        const data = await Robot.find();
        res.render('index', {locals, data, messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});
//get method that renders about page
router.get('/about', async (req, res) => {
    const locals = {
        title: "Scout-It-About",
    }

    const messages = {
        error: req.flash('error')
    };

    try{
        res.render('about', {locals, messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});
//get method to fetch the match of the robot
router.get('/matches/:teamNum/:matchNo', async (req, res) => {
    const teamNum = req.params.teamNum;
    const matchNo = req.params.matchNo;
    const messages = {
        error: req.flash('error')
    };
    try{
        const teamsMatches = MatchCollection(teamNum);
        const matchData = await teamsMatches.findOne({MatchNo: matchNo}).lean();
        res.json({matchData, messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
})
//get method to get full analysis of the data and renders analysis page
router.get('/analysis', async (req, res) => {
    const locals = {
        title: "Scout-It-Analysis",
    }

    const messages = {
        error: req.flash('error')
    };

    const data = await Robot.find();
    try{
        res.render('analysis', {locals, data, messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});
router.get('/analysis/:teamNum/:matchno/:field', async (req, res) => {
    const teamNum = req.params.teamNum;
    const matchNo = req.params.matchno;
    const field = req.params.field;
    const messages = {
        error: req.flash('error')
    };
    try{
        const teamsMatches = MatchCollection(teamNum);
        const matchData = await teamsMatches.findOne({MatchNo: matchNo}).lean();
        res.json({[field]: matchData[field], messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});


////////////////////////////////////////////////////post methods///////////////////////////////////////////////////////////////////////////////
//post methods that adds a new robot in robot collection and makes a new collection for each robot to store matches data
router.post('/add-robot', upload.single('robotImage'), async (req, res) => {
    const robotImage = req.file ? req.file.buffer : undefined;

    const newRobot = new Robot ({
        TeamNum: req.body.teamNum,
        TeamName: req.body.teamName,
        RobotName: req.body.robotName,
        RobotImage: robotImage,

        Weight: '',
        FrameSize: '',
        Drivetrain: '',
        ScorePlace: '',
        AdjustableShooter: '',
        ClimbAndTrap: '',
        AutoStrats: '',
        SpecialfeaturesAndLimitations: ''
    })

    try {
        await newRobot.save();
        const matchModel = MatchCollection(req.body.teamNum)
        for(let i = 1; i <= 12; i++){
            const initialMatch = new matchModel ({
                MatchNo: i,
                SpeakerNotes: '',
                AmpNotes: '',
                PassedNotes: '',
                AutoNotes: '',
                Climb: '',
                Trap: '',
                AdditionalNotes: ''
            });
            
            await initialMatch.save();
        }
        res.redirect('/'); // Redirect to the main page
    } catch (e) {
        console.error('Error saving robot:', e); // Log the error

        if (e.code === 11000) {
            // Handle duplicate key error
            req.flash('error', 'Team number already exists. Try Again');
            res.redirect('/');
        } else {
            // Handle other types of errors
            res.status(500).send('Internal Server Error');
        }
    }
})

//delete method to delete entire data or a robot
router.delete('/delete/:teamNum', async (req, res) => {
    try {
        const teamNum = req.params.teamNum;
        await Robot.findOneAndDelete({ TeamNum: teamNum });
        await mongoose.connection.db.dropCollection(`team_${teamNum}_matches`);
        res.status(200).send({ message: 'Robot deleted successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to delete robot' });
    }
});

//put methods
//put methods to change the image and robot name
router.put('/name-image-update/:teamNum', upload.single('RobotImage'), async (req, res) => {
    const teamNum = req.params.teamNum;
    const updateData = {};

    // Update the RobotName if provided
    if (req.body.robotName) {
        updateData.RobotName = req.body.robotName;
    }

    // Update the RobotImage only if a file is uploaded
    if (req.file) {
        updateData.RobotImage = req.file.buffer;
    }

    try {
        const updatedRobot = await Robot.findOneAndUpdate(
            { TeamNum: teamNum },
            updateData,
            { new: true }
        );

        if (!updatedRobot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        res.status(200).json({ message: 'Robot updated successfully', robot: updatedRobot });
    } catch (error) {
        console.error('Error updating robot:', error);
        res.status(500).json({ message: 'An error occurred while updating the robot' });
    }
});
//put method to update the pitscout
router.put('/update/:teamNum', async (req, res) => {
    const teamNum = req.params.teamNum;
    const updateData = req.body;

    try {
        const updatedRobot = await Robot.findOneAndUpdate(
            { TeamNum: teamNum },
            updateData,
            { new: true }
        );

        if (!updatedRobot) {
            return res.status(404).json({ message: 'Robot not found' });
        }

        res.status(200).json({ message: 'Robot updated successfully', robot: updatedRobot });
    } catch (error) {
        console.error('Error updating robot:', error);
        res.status(500).json({ message: 'An error occurred while updating the robot' });
    }
});
//put method to update the matchs of the robot
router.put('/matchupdate/:teamNum/:matchNo', async (req, res) => {
    const teamNum = req.params.teamNum;
    const matchNo = req.params.matchNo;
    const updateData = req.body;

    try {
        const matchModel = MatchCollection(teamNum)
        const updatedmatch = await matchModel.findOneAndUpdate(
            { MatchNo: matchNo },
            updateData,
            { new: true }
        );

        if (!updatedmatch) {
            return res.status(404).json({ message: 'match not found' });
        }

        res.status(200).json({ message: 'match updated successfully', robot: updatedmatch });
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ message: 'An error occurred while updating the match' });
    }
});

module.exports = router;