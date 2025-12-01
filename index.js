const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose
  .connect(
    "mongodb://artembasko:0pfndvbze@cluster0-shard-00-00.ybmff6z.mongodb.net:27017,cluster0-shard-00-01.ybmff6z.mongodb.net:27017,cluster0-shard-00-02.ybmff6z.mongodb.net:27017/comp3123_assignment1?ssl=true&replicaSet=atlas-ybmff6z-shard-0&authSource=admin&retryWrites=true&w=majority"
  )
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Schemas
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const employeeSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  position: String,
  salary: Number,
  date_of_joining: Date,
  department: String,
  profile_image: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Employee = mongoose.model("Employee", employeeSchema);

// file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Signup
app.post("/api/v1/user/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return res.status(409).json({ message: "User already exists" });

    const user = await User.create({ username, email, password });

    res.status(201).json({
      message: "User created successfully.",
      user_id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/v1/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });

    if (!user)
      return res
        .status(401)
        .json({ message: "Invalid Username and password" });

    const token = "dummy-token-" + user._id;

    res.status(200).json({ message: "Login successful.", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get employees
app.get("/api/v1/emp/employees", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// search employees
app.get("/api/v1/emp/employees/search", async (req, res) => {
  try {
    const { department, position } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (position) filter.position = position;

    const employees = await Employee.find(filter);
    res.status(200).json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add employee
app.post(
  "/api/v1/emp/employees",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      const data = req.body;

      if (req.file) {
        data.profile_image = `/uploads/${req.file.filename}`;
      }

      const emp = await Employee.create(data);

      res.status(201).json({
        message: "Employee created successfully.",
        employee: emp,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get employee
app.get("/api/v1/emp/employees/:eid", async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.eid);
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.status(200).json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update employee
app.put(
  "/api/v1/emp/employees/:eid",
  upload.single("profile_image"),
  async (req, res) => {
    try {
      const updates = { ...req.body };

      if (req.file) {
        updates.profile_image = `/uploads/${req.file.filename}`;
      }

      const emp = await Employee.findByIdAndUpdate(req.params.eid, updates, {
        new: true,
      });

      if (!emp) return res.status(404).json({ message: "Employee not found" });

      res.status(200).json({
        message: "Employee updated successfully.",
        employee: emp,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// DELETE employee
app.delete("/api/v1/emp/employees", async (req, res) => {
  try {
    const { eid } = req.query;

    const emp = await Employee.findByIdAndDelete(eid);

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// starting server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`)
);