const express = require("express");
const app = express();
const path = require("path");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const API_URL =  "https://vercel-frontend-1.onrender.com";
const dotenv = require("dotenv");
dotenv.config();
require("dotenv").config();
app.use(cors({
  origin: "https://hostel-pass.netlify.app", 
  methods: ['GET','POST','PUT','DELETE','OPTIONS'], 
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}));
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });
app.get("/", (req, res) => {
  res.send("Backend is running!");
});
 
 
const session = require("express-session");

app.use(session({
  secret: 'Rinku@4056', // use a long random value
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // true if using https
    maxAge: 1000 * 60 * 60 // 1h
  }
}));


// Example using the environment variables
// const dbConfig = {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// };

app.get("/test", (req, res) => {
  res.json({ message: "CORS is working!" });
});
app.use(bodyParser.json());
// const { message } = require('statuses');
//  const con=mysql.createConnection({
//   host: 'localhost',  // MySQL server host (default is 'localhost')
//   user: 'root',       // Your MySQL username (e.g., 'root')
//   password: 'dixit', // Your MySQL password
//   database: 'outpass'
// } );

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error connecting to Neon DB:", err.stack);
    return;
  }
  console.log("✅ Connected to Neon PostgreSQL DB");
  release();
});
//  app.post('/login',(req,res)=>{
//   const{cardno,password}=req.body;
//   const query='SELECT *FROM login WHERE cardno=? AND password=?';
//   con.query(query,[cardno,password],(err,results)=>{
//     if(err){
//       console.error('database query error',err);
//       return res.status(500).json({message:'internal server error'});
//     }
//     if(results.length>0){
//       res.status(200).json({message:'login succesful'});
//     }
//     else{
//       res.status(401).json({message:'invalid cardno or password'})
//     }
//   });
//  });
//  app.get('/response',(req,res)=>{
//    const status=req.query;
//    res.send('${status}');
//    console.log('getting response');
//  });
app.post("/login", async (req, res) => {
  const { cardno, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM login WHERE cardno = $1 AND password = $2",
      [cardno, password]
    );

    if (result.rows.length > 0) {
      req.session.cardno = cardno;
      res.send("Login successful");
    } else {
      res.status(401).send("Login failed");
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
});

app.post("/submit", async (req, res) => {
  const { name, roomno, reason, timeout, timein } = req.body;
  const cardno = req.session.cardno;
  if (!cardno) {
    return res.status(401).send("Not logged in");
  }
  const token = require("crypto").randomBytes(32).toString("hex");
  await pool.query(
    "INSERT INTO requests (cardno, reason, token) VALUES ($1, $2, $3)",
    [cardno, reason, token]
  );
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rinkudixit193@gmail.com", // Your email
        pass: "zywf yxoz rxsn cxsk", // app password
      },
    });
    const approveLink=`${API_URL}/approve?token=${token}`;
    const rejectLink=`${API_URL}/reject?token=${token}`;
    const mailOptions = {
      from: "rinkudixit193@gmail.com",
      to: "rinkudixit4056@gmail.com",
      subject: "Outpass Request",
      text: `Dear Warden,
       A new outpass request has been submitted by a student. Details are as follows:
    Name: ${name}
    Card Number: ${roomno}
    Reason: ${reason}
    
      Please respond with "Approved" or "Rejected".
      Approve: ${approveLink}
       Reject: ${rejectLink}  
    Regards,
    Outpass System`,
    };

    const response1 = await transporter.sendMail(mailOptions);
    console.log("Email sent:", response1.response);

    // Send success response to the client
    res
      .status(200)
      .send("Request submitted successfully. Email sent to warden.");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
});
app.get("/approve", async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query(
      "UPDATE requests SET status = 'approved' WHERE token = $1 RETURNING cardno",
      [token]
    );
    if (result.rowCount === 0) {
      return res.send("Invalid or expired link.");
    }

    const cardno = result.rows[0].cardno;
    res.send(`✅ Request for cardno ${cardno} has been APPROVED!`);
    // Optionally send email/notification to the student
  } catch (error) {
    console.error(error);
    res.send("Error processing the request.");
  }
});
app.get("/reject", async (req, res) => {
  const { token } = req.query;

  try {
    const result = await pool.query(
      "UPDATE requests SET status = 'rejected' WHERE token = $1 RETURNING cardno",
      [token]
    );
    if (result.rowCount === 0) {
      return res.send("Invalid or expired link.");
    }

    const cardno = result.rows[0].cardno;
    res.send(`❌ Request for cardno ${cardno} has been REJECTED.`);
    // Optionally send email/notification to the student
  } catch (error) {
    console.error(error);
    res.send("Error processing the request.");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
