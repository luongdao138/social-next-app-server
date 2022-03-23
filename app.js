require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();
const cors = require('cors');

const connectDb = require('./db/connectDb');
const notFoundMiddleware = require('./middlewares/notFoundMiddleware');
const errorHandlerMiddleware = require('./middlewares/errorHandlerMiddleware');

// routes import
const authRouter = require('./routes/auth.routes');
const userRouter = require('./routes/user.routes');

app.use(express.json());
app.use(
  cors({
    origin: ['http://localhost:3000'],
  })
);

connectDb();

// routes middlewares
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);

// error hander
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
