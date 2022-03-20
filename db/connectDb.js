const mongoose = require('mongoose');

const connectDb = () => {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to db successfully!');
    })
    .catch((error) => {
      console.log(error);
      process.exit(1);
    });
};

module.exports = connectDb;
