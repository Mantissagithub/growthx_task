const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const adminRouter = require("./routes/admin1");
const userRouter = require("./routes/user1");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // use environment variable for port

// middleware setup
app.use(cors());
app.use(express.json());

// route setup
app.use("/admin", adminRouter);
app.use("/user", userRouter);

// database connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb+srv://mantissa6789:Mantis%402510@cluster0.9ramotn.mongodb.net/growthx_task', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected..."))
  .catch((error) => console.error("MongoDB connection error:", error));

// start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});