const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/leave-management"
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err))

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "employee" },
  department: { type: String, default: "" },
  employeeId: { type: String, unique: true },
  leaveBalance: {
    annual: { type: Number, default: 20 },
    sick: { type: Number, default: 10 },
    personal: { type: Number, default: 5 },
    emergency: { type: Number, default: 5 },
    maternity: { type: Number, default: 90 },
  },
  createdAt: { type: Date, default: Date.now },
})

// Leave Request Schema
const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  leaveType: { type: String, enum: ["annual", "sick", "personal", "maternity", "emergency"], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminComments: { type: String, default: "" },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
})

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { type: String, required: true },
  description: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
})

const User = mongoose.model("User", userSchema)
const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema)
const AuditLog = mongoose.model("AuditLog", auditLogSchema)

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Access token required" })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" })
    }
    req.user = user
    next()
  })
}

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" })
  }
  next()
}

// Routes

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, department } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate employee ID
    const employeeId = "EMP" + Date.now().toString().slice(-6)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      department,
      employeeId,
    })

    await user.save()

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        leaveBalance: user.leaveBalance,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate token
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        leaveBalance: user.leaveBalance,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user profile
app.get("/api/auth/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password")
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Submit leave request
app.post("/api/leave/request", authenticateToken, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body

    const leaveRequest = new LeaveRequest({
      userId: req.user.userId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
    })

    await leaveRequest.save()
    await leaveRequest.populate("userId", "name email employeeId")

    res.status(201).json({
      message: "Leave request submitted successfully",
      leaveRequest,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get user's leave requests
app.get("/api/leave/my-requests", authenticateToken, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user.userId })
      .populate("reviewedBy", "name")
      .sort({ appliedAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all leave requests (Admin only)
app.get("/api/leave/all-requests", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .populate("userId", "name email employeeId department")
      .populate("reviewedBy", "name")
      .sort({ appliedAt: -1 })
    res.json(requests)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update leave request status (Admin only)
app.put("/api/leave/update-status/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, adminComments } = req.body
    const requestId = req.params.id

    const leaveRequest = await LeaveRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        adminComments,
        reviewedAt: new Date(),
        reviewedBy: req.user.userId,
      },
      { new: true },
    ).populate("userId", "name email employeeId")

    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" })
    }

    res.json({
      message: "Leave request updated successfully",
      leaveRequest,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get dashboard stats (Admin only)
app.get("/api/admin/dashboard-stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: "employee" })
    const pendingRequests = await LeaveRequest.countDocuments({ status: "pending" })
    const approvedRequests = await LeaveRequest.countDocuments({ status: "approved" })
    const rejectedRequests = await LeaveRequest.countDocuments({ status: "rejected" })

    res.json({
      totalEmployees,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all employees (Admin only)
app.get("/api/admin/employees", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).select("-password")
    res.json(employees)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Create employee (Admin only)
app.post("/api/admin/employees", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, department } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Hash password
    if (!password) {
      return res.status(400).json({ message: "Password is required" })
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate employee ID
    const employeeId = "EMP" + Date.now().toString().slice(-6)

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      department,
      employeeId,
      role: "employee",
    })

    await user.save()

    res.status(201).json({
      message: "Employee created successfully",
      employee: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        leaveBalance: user.leaveBalance,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update employee (Admin only)
app.put("/api/admin/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, department, employeeId } = req.body
    const userId = req.params.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Update fields
    if (name) user.name = name
    if (email) user.email = email
    if (department) user.department = department
    if (employeeId) user.employeeId = employeeId

    await user.save()

    res.json({
      message: "Employee updated successfully",
      employee: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        leaveBalance: user.leaveBalance,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get single employee (Admin only)
app.get("/api/admin/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id
    const user = await User.findById(userId).select("-password")
    
    if (!user) {
      return res.status(404).json({ message: "Employee not found" })
    }

    res.json(user)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete employee (Admin only)
app.delete("/api/admin/employees/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id

    // Delete user
    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      return res.status(404).json({ message: "Employee not found" })
    }

    // Delete all leave requests for this user
    await LeaveRequest.deleteMany({ userId: userId })

    // Delete all audit logs for this user
    await AuditLog.deleteMany({ userId: userId })

    res.json({
      message: "Employee deleted successfully",
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get audit logs (Admin only)
app.get("/api/logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100
    const logs = await AuditLog.find()
      .populate("userId", "name email employeeId")
      .sort({ timestamp: -1 })
      .limit(limit)
    
    // Transform logs to match frontend format
    const transformedLogs = logs.map(log => ({
      id: log._id,
      userId: log.userId?._id || log.userId,
      userName: log.userId?.name || "Unknown User",
      action: log.action,
      description: log.description,
      details: log.details,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
    }))
    
    res.json(transformedLogs)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Reset audit logs (Admin only)
app.delete("/api/logs/reset", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await AuditLog.deleteMany({})
    
    // Create an audit log entry for the reset action
    const resetLog = new AuditLog({
      userId: req.user.userId,
      action: "audit_logs_reset",
      description: "System Administrator reset all audit logs",
      details: {
        deletedCount: result.deletedCount,
      },
      timestamp: new Date(),
    })
    await resetLog.save()
    
    res.json({
      message: "Audit logs reset successfully",
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
