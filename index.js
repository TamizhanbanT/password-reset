
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors=require("cors")
const mongoose = require('mongoose');
const dotenv = require('dotenv')
dotenv.config()

const app = express();
const PORT = 5000;

// MongoDB Atlas connection
mongoose.connect(process.env.mongo_url);

// Create a User model
const User = mongoose.model('users', {
  email: String,
  password:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Middleware
app.use(bodyParser.json());
app.use(express.json())
app.use(cors())


// Route to handle password reset request
app.post('/api/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });


    console.log(user)

     if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } 

    // Generate random token for password reset
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send password reset email
    const transporter = nodemailer.createTransport({
      host: 'smtp.mailersend.net',
      port: 587,
      auth: {
          user: 'MS_4adyJY@trial-351ndgwyzpxlzqx8.mlsender.net',
          pass: 'E9V4kZ0N4mmSibMx'
      }
  });
    
    const mailOptions = {
       from: 'MS_4adyJY@trial-351ndgwyzpxlzqx8.mlsender.net',
      to: email,
      subject: 'Password Reset',
      text: `steps to follow:\n
      1.Go to link and copy the userId and Token. \n
      2.change your new password 
      You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            ${req.protocol}://${req.get('host')}/api/reset/${token}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send reset email' });
      }
      res.json({ message: 'Reset email sent' });
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Route to handle password reset confirmation
app.get('/api/reset/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Token validated', userId: user._id,Token:user.resetPasswordToken });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Failed to validate token' });
  }
});



// Route to handle password reset form submission
app.post('/api/reset/:token', async (req, res) => {
  const { token } = req.params;
  const { userId, newPassword } = req.body;

  const pass = await req.body.password

  try {
    const user = await User.findOne({
      _id: userId,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }

    // Update user's password and clear reset token
    user.password = pass;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});


// user login

app.post("/login", async (req, res) => {
  try {

      const user = await User.findOne({
          email: req.body.email,
          password: req.body.password
          })
      if (user) {
          res.send(user)
      } else {
          res.send({ message: "Login Failed", user })
      }

  } catch (error) {
      res.status(400).json(error)
  }
})



// user register

app.post("/register", async (req, res) => {
  try {
      
      console.log("register", req.body)

      const user1 = await User.findOne({
          email: req.body.email,
         
      })
      if(!user1){
      const newUser = new User({ ...req.body})
      await newUser.save() //create a new user
      console.log(newUser)
      res.send("User registered successfully")
      }
      else{
          res.send("User already registered try different userId")
      }
  } catch (error) {
      res.send({ message: "Error creating user" })
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
