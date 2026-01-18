import express from 'express';
import { configDotenv } from 'dotenv';

configDotenv();

const app = express();

const PORT = process.env.PORT;

app.get('/',(_req,res)=>{
  res.json({message: "app running successfully!", status: "success"});
});

app.listen(PORT, ()=>{
  console.log(`app is running on Port: ${PORT}`)
});