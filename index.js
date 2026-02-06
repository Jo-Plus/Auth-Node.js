const express = require("express");
require("dotenv").config();
const cors = require("cors");
const hpp = require("hpp");
const xss = require("xss-clean");
const helmet = require("helmet");
const path = require("path");

const connectToDb = require("./config/connect-to-db");
const { notFound, errorhandler } = require("./middleware/error");

const app = express();
const PORT = process.env.PORT || 4000;

// Database Connection
connectToDb();

// Middlewares
app.use(helmet());
app.use(hpp());
app.use(xss());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static
app.use("/images", express.static(path.join(__dirname, "images")));

// Routes
app.get("/", (req, res) => {
  res.send("Hello Broo Local - Server is Running on Vercel");
});

app.use("/api/auth", require("./routes/authroute"));
app.use("/api/users", require("./routes/usersroute"));
app.use("/api/password", require("./routes/passwordroute"));
app.use("/api/teams", require("./routes/team-route.js"));
app.use("/api/teams/invitations", require("./routes/invitation-route.js"));

// Error Handling
app.use(notFound);
app.use(errorhandler);

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;