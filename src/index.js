const express = require('express');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const complaintRoutes = require('./routes/complaints');
const { startOnboardingCron } = require('./services/onboardingCron');
require('./models');

require('dotenv').config();

const app = express();

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/complaints', complaintRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the ZocialOne Backend API');
});

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected Successfully...');
    
    await sequelize.sync({ force: false });
    //console.log('Models synced.');

    startOnboardingCron();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } 
  catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
})();
