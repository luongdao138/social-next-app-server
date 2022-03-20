require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

const connectDb = require('./db/connectDb');

app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000'],
  })
);

connectDb();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
