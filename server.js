const express=require('express');
const app=express();
const path = require('path');
 const mysql=require('mysql2');
 const bodyParser=require('body-parser');
 const cors = require('cors');
 const nodemailer=require('nodemailer');
app.use(cors());
require('dotenv').config();
app.get("/", (req, res) => {
    res.send("Backend is running!");
});


app.use(cors({
  origin: 'http://127.0.0.1:5501', // Allow your front-end origin
  methods: ['GET', 'POST'], // Allow specific HTTP methods
  credentials: true // Include cookies if needed
}));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
 import dotenv from 'dotenv';
dotenv.config();

// Example using the environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

   

app.get('/test', (req, res) => {
  res.json({ message: 'CORS is working!' });
});
 app.use(bodyParser.json());
const { message } = require('statuses');
 const con=mysql.createConnection({
  host: 'localhost',  // MySQL server host (default is 'localhost')
  user: 'root',       // Your MySQL username (e.g., 'root')
  password: 'dixit', // Your MySQL password
  database: 'outpass'
} );

 
 
con.connect((err) => {
  if (err) {
    console.error('error connecting:' + err.stack);
    return;
  }
  console.log('connected as id ' + con.threadId);
});

 app.post('/login',(req,res)=>{
  const{cardno,password}=req.body;
  const query='SELECT *FROM login WHERE cardno=? AND password=?';
  con.query(query,[cardno,password],(err,results)=>{
    if(err){
      console.error('database query error',err);
      return res.status(500).json({message:'internal server error'});
    }
    if(results.length>0){
      res.status(200).json({message:'login succesful'});
    }
    else{
      res.status(401).json({message:'invalid cardno or password'})
    }
  });
 }); 
//  app.get('/response',(req,res)=>{
//    const status=req.query;
//    res.send('${status}');
//    console.log('getting response');
//  });
 app.post('/submit',  async (req,res)=>{
      const{name,roomno,reason,timeout,timein}=req.body;
      try {
    
        const transporter = nodemailer.createTransport({
          service: 'gmail',  
          auth: {
            user: 'rinkudixit193@gmail.com', // Your email
            pass: 'zywf yxoz rxsn cxsk', // Your email password or app password
          },
           
     });
     const mailOptions = {
      from: 'rinkudixit193@gmail.com',
      to: 'rinkudixit4056@gmail.com',
      subject: 'Outpass Request',
      text: `Dear Warden,
       A new outpass request has been submitted by a student. Details are as follows:
    Name: ${name}
    Card Number: ${roomno}
    Reason: ${reason}
    
      Please respond with "Approved" or "Rejected".
        approve :http://localhost:3000/response?status=approved&id=123
        reject:http://localhost:3000/response?status=rejected&id=123
    
    Regards,
    Outpass System`,
     };
     
      const response1=  await transporter.sendMail(mailOptions);
     console.log('Email sent:', response1.response);

     // Send success response to the client
     res.status(200).send('Request submitted successfully. Email sent to warden.');
     
    
  }
  catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
 });
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
 