require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const branchRoutes = require("./routes/branches");
const userRoutes = require("./routes/users");
const normRoutes = require("./routes/norms");
const stockRoutes = require("./routes/stock");
const menuRoutes = require("./routes/menu");
const activityRoutes = require("./routes/activities");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/norms", normRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/activities", activityRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Serverda kutilmagan xatolik yuz berdi" });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`MittiQadam backend http://localhost:${port}`);
});
