const express = require('express');
const router = express.Router();
const multer = require('multer');

const MatchCollection = require('../models/robot-matches');
const Robot = require('../models/robot');
const Users = require('../models/users');
const mongoose = require('mongoose');
const Priority = require('../models/priority-list');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//*----------------------------------------------------------getmethods------------------------------------------------>

//^homepage
router.get('', async (req, res) => {
    const loggedInUserId = req.session.user ? req.session.user._id : null;
    const locals = {
        title: "Scout-It",
    }
    const messages = {
        error: req.flash('error')
    };
    try{
        const data = await Robot.find();
        res.render('index', {locals, data, messages, loggedInUserId});
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error'); 
    }
});

//^about-page
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

//^fetching-math-data
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

//^analysis-page
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

//^fetching all the data for spread sheet
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

//^selection-list-page
router.get('/selection-list', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'scoutlead' || req.session.user.roles === 'admin')) {
        const locals = {
            title: "Scout-It",
        }
        const messages = {
            error: req.flash('error')
        };
        try{
            const data = await Robot.find();
            const priorities = await Priority.find().sort('priorityNum');

            // Get all team numbers that are already assigned
            const assignedTeams = priorities.map(priority => priority.teamNum).filter(team => team !== null);

            // Filter out the assigned teams from the team list
            const availableTeams = data.filter(bot => !assignedTeams.includes(bot.TeamNum));

            res.render('selection-list', {locals, data, messages, priorities, availableTeams });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error'); 
        }
    } else {
        res.status(403).send({ message: 'Access denied. Admins only.' });
    }
});

//^user-login-page
router.get('/user-login', (req, res) => {
    const locals = {
        title: "Scout-It",
    };
    const messages = {
        error: req.flash('error'),
    };
    try {
        res.render('user-login', { layout: './layouts/login', locals, messages });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

//^admin-login-page (only access by direct link)
router.get('/admin', (req, res) => {
    const locals = {
        title: "Scout-It",
    };
    const messages = {
        error: req.flash('error'),
    };
    try {
        res.render('admin-login', { layout: './layouts/login', locals, messages });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

//^admin-portal-page
router.get('/admin-portal', async (req, res) => {
    if (req.session.user && req.session.user.roles === 'admin') {
        const loggedInUserId = req.session.user._id;
        const locals = {
            title: "Scout-It",
        };
        const messages = {
            error: req.flash('error'),
        };
        try {
            const data = await Users.find();
            res.render('admin-portal', {locals, messages, data, loggedInUserId });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(403).send({ message: 'Access denied. Admins only.' });
    }
});

//^logout
router.get('/logout', (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            res.redirect('/');
        } else {
            res.redirect('/');
        }
    });
});

//*----------------------------------------------------------postmethods------------------------------------------------>

//^add-robots
router.post('/add-robot', upload.single('robotImage'), async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scout' || req.session.user.roles === 'scoutlead')) {
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
            SpecialfeaturesAndLimitations: '',
            lastUpdatedBy: ''
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
                    AdditionalNotes: '',
                    lastUpdatedBy: ''
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
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
})

//^admin-log-in
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Users.findOne({ username });

        if (!user || user.password !== password) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/admin'); // Redirect to the login page
        }

        req.session.user = user;

        if (user.roles === 'admin') {
            req.session.user = user;
            req.session.loginTime = Date.now();
            req.session.cookie.maxAge = 50000000;//5 min
            res.redirect('/');
        } else {
            req.flash('error', 'Only admin accounts allowed here');
            res.redirect('/admin');
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/admin'); // Redirect to the login page
    }
});

//^user-log-in
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await Users.findOne({ username });

        if (!user || user.password !== password) {
            req.flash('error', 'Invalid username or password');
            return res.redirect('/user-login'); // Redirect to the login page
        }

        req.session.user = user;
        if (user.roles === 'scout' || user.roles === 'scoutlead') {
            req.session.user = user;
            req.session.loginTime = Date.now();
            req.session.cookie.maxAge = 50000000;//5 min
            res.redirect('/');
        } else {
            req.flash('error', 'Admins can not login here');
            return res.redirect('/user-login');
        }
    } catch (error) {
        console.error(error);
        req.flash('error', 'Internal Server Error');
        res.redirect('/user-login'); // Redirect to the login page
    }
});

//^add-users
router.post('/admin/add-user',  async (req, res) => {
    const userdata = req.body;
    const newUser = new Users(userdata);

    try{
        await newUser.save();
        return res.status(200).json({
            message: 'User added successfully',
            success: true
        });
    } catch (e) {
        console.error('Error saving robot:', e); // Log the error
    
        if (e.code === 11000) {
            res.status(409).json({ 
                message: 'Username already exists', 
                success: false 
            });
        } else {
            res.status(500).json({ 
                message: 'Internal Server error', 
                success: false 
            });
        }
    }
});

//^add-priority
router.post('/add-priorities', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scoutlead')) {
        const { priorityNum } = req.body;

        const priority = new Priority({ priorityNum: priorityNum, teamNum: '' });

        try {
            // Save the new Priority document to the database
            await priority.save();
            res.status(200).json({ success: true, message: 'Priority added successfully.' });
        } catch (e) {
            console.error('Error saving priority:', e);
            res.status(500).json({ success: false, message: 'Failed to add priority.' });
            }
    }else {
        res.status(403).send({ message: 'Access denied. Admins only.' });
    }
});

//*----------------------------------------------------------deletemethods------------------------------------------------>

//^delete-robot
router.delete('/delete/:teamNum', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scoutlead')) {
        try {
            const teamNum = req.params.teamNum;
            await Robot.findOneAndDelete({ TeamNum: teamNum });
            await mongoose.connection.db.dropCollection(`team_${teamNum}_matches`);
            res.status(200).json({ 
                message: 'Robot deleted successfully', 
                success: true,  
            });
        } catch (error) {
            res.status(500).json({ 
                message: 'Failed to delete user', 
                success: false 
            });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

//^delete-user
router.delete('/admin/delete-user/:id', async (req, res) => {
    if (req.session.user && req.session.user.roles === 'admin') {
        try {
            const uid = req.params.id;
            await Users.findOneAndDelete({ _id: uid });
            res.status(200).json({ 
                message: 'user deleted successfully', 
                success: true,  
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: 'Failed to delete user', 
                success: false 
            });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

//^delete-priority
router.delete('/delete-priority/:id', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scoutlead')) {
        await Priority.findByIdAndDelete(req.params.id);
        res.status(204).end();
    }else {
        res.status(403).send({ message: 'Access denied. Admins only.' });
    }
});

//*----------------------------------------------------------putmethods------------------------------------------------>

//^edit robot name and image
router.put('/name-image-update/:teamNum', upload.single('RobotImage'), async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scout' || req.session.user.roles === 'scoutlead')) {
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

            res.status(200).json({ 
                message: 'Robot updated successfully', 
                success: true, 
                robot: updatedRobot 
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ 
                message: 'Error occured while updating', 
                success: false 
            });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

//^edit pit scout
router.put('/update/:teamNum', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scout'|| req.session.user.roles === 'scoutlead')) {
        const teamNum = req.params.teamNum;
        const updateData = req.body;
        const updatedBy = req.session.user.username;
        
        try {
            const updatedRobot = await Robot.findOneAndUpdate(
                { TeamNum: teamNum },
                { 
                    ...updateData, // Spread the updateData to update individual fields
                    lastUpdatedBy: updatedBy 
                },
                { new: true } // This option returns the updated document
            );

            if (!updatedRobot) {
                return res.status(404).json({ message: 'Robot not found' });
            }
            
            console.log(updateData)
            res.status(200).json({ 
            message: 'Robot updated successfully', 
            success: true, 
            robot: updatedRobot 
            });

        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ 
                message: 'Error occured while updating', 
                success: false 
            });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

//^edit match scout
router.put('/matchupdate/:teamNum/:matchNo', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' || req.session.user.roles === 'scout'|| req.session.user.roles === 'scoutlead')) {
        const teamNum = req.params.teamNum;
        const matchNo = req.params.matchNo;
        const updateData = req.body;
        const updatedBy = req.session.user.username;

        try {
            const matchModel = MatchCollection(teamNum)
            const updatedmatch = await matchModel.findOneAndUpdate(
                { MatchNo: matchNo },
                { 
                    ...updateData, // Spread the updateData to update individual fields
                    lastUpdatedBy: updatedBy 
                },
                { new: true }
            );

            if (!updatedmatch) {
                return res.status(404).json({ message: 'Match not found' });
            }
            
            res.status(200).json({ 
                message: 'Match updated successfully', 
                success: true, 
                match: updatedmatch 
            });
        } catch (error) {
            console.error('Error updating match:', error);
            res.status(500).json({ 
                message: 'Internal server error', 
                success: false 
            });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

//^edit users
router.put('/admin/update-user/:id', async (req, res) => {
    if (req.session.user && req.session.user.roles === 'admin') {
        const userId = req.params.id;
        const updateData = req.body;
        try {
            const updatedUser = await Users.findOneAndUpdate(
                { _id: userId },
                updateData,
                { new: true }
            );
            if (!updatedUser) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ 
                message: 'User updated successfully', 
                success: true, 
                user: updatedUser 
            });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ 
                message: 'Internal server error', 
                success: false 
            });
        }
    } else {
        res.status(403).send({ message: 'Access denied' });
    }
});

//^edit selection list
router.put('/update-priority/:id', async (req, res) => {
    if (req.session.user && (req.session.user.roles === 'admin' ||  req.session.user.roles === 'scoutlead')) {
        try {
            const { teamNum } = req.body;
            await Priority.findByIdAndUpdate(req.params.id, { teamNum });
            res.status(200).json({ message: 'Priority updated successfully' });
        } catch (error) {
            console.error('Error updating priority:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    } else {
        res.status(403).json({ 
            message: 'Access denied', 
            success: false 
        });
    }
});

module.exports = router;