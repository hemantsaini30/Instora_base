const app = require('./src/app');
const connectDB = require('./src/config/db');
const { startJobs } = require('./src/jobs/index');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Instora server running on port ${PORT}`);
    startJobs();
  });
});