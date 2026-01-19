const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AUTH } = require('../constants');


async function signup(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required..',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address..',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long..',
      });
    }

    const existing = await User.findOne({ where: { email: email.toLowerCase() } });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'User already exists. Please login..',
      });
    }

    const hashedPassword = await bcrypt.hash(password, AUTH.SALT_ROUNDS);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });
    // console.log("user details--->",user);
    user.password=undefined;

    return res.status(201).json({
      success: true,
      message: 'User created successfully..',
      user:user
    });

  } 
  catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while signing up user',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required..',
      });
    }

    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    // console.log("user details login--->",user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.Signup first..',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password. Please try again..',
      });
    }


    const token = jwt.sign({ userId: user.id },process.env.JWT_SECRET,{ expiresIn: AUTH.TOKEN_EXPIRY });
    user.password=undefined;

    // const userData = {
    //   id: user.id,
    //   name: user.name,
    //   email: user.email,
    //   onboarding_stage: user.onboarding_stage,
    //   created_at: user.created_at,
    // };

    return res.json({
      success: true,
      message: 'Login successful..',
      user: user,
      token:token,
    });
  }
   catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Error while logging in',
    });
  }
}

module.exports = {signup,login};
