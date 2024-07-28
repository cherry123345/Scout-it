const express = require('express');
const router = express.Router();
const Robot = require('../models/robot');
const multer = require('multer');


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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


router.post('/add-robot', upload.single('robotImage'), async (req, res) => {
    const robotImage = req.file ? req.file.buffer : undefined;

    const newRobot = new Robot ({
        TeamNum: req.body.teamNum,
        TeamName: req.body.teamName,
        RobotName: req.body.robotName,
        RobotImage: robotImage,

        Weight: '',
        FrameSize: null,
        Drivetrain: '',
        ScorePlace: '',
        AdjustableShooter: '',
        ClimbAndTrap: '',
        SpecialfeaturesAndLimitations: ''
    })

    try {
        await newRobot.save();
        res.redirect('/'); // Redirect to the main page
    } catch (e) {
        console.error('Error saving robot:', e); // Log the error

        if (e.code === 11000) {
            // Handle duplicate key error
            req.flash('error', 'Team number already exists. Try Again');
            res.redirect('/');
        } else {
            // Handle other types of errors
            res.status(500).send('Internal Server Error'); // Send a generic error message
        }
    }
})

router.delete('/delete/:teamNum', async (req, res) => {
    try {
        const teamNum = req.params.teamNum;
        await Robot.findOneAndDelete({ TeamNum: teamNum });
        res.status(200).send({ message: 'Robot deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Failed to delete robot' });
    }
});
module.exports = router;

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

router.get('/about', async (req, res) => {
    const locals = {
        title: "Scout-It-About",
    }

    const messages = {
        error: req.flash('error')
    };

    try{
        res.render('layouts/about', {locals, messages});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});