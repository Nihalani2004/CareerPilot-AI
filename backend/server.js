require('dotenv').config();
const app = require('./src/app');
const connectToDB = require("./src/config/database");
// const { resume, selfDescription, jobDescription } = require("./src/services/temp");
// const generateInterviewReport = require("./src/services/ai.service")

connectToDB();
// generateInterviewReport({ resume, selfDescription, jobDescription });

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
