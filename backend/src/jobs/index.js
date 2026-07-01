const cron = require('node-cron');
const runFeeAutoGenerate = require('./feeAutoGenerate');

const startJobs = () => {
  // Run every day at 00:05 AM
  cron.schedule('5 0 * * *', async () => {
    await runFeeAutoGenerate();
  });

  console.log('✅ Scheduled jobs started');
};

module.exports = { startJobs, runFeeAutoGenerate };