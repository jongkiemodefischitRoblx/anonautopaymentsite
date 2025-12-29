const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

const slug = "payment-anon";
const api_key = "0qWr1eUUu5KVc53cWl8c3Lj1CbK92G38";

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

let transactions = {};
let clients = [];

// SSE endpoint
app.get('/events',(req,res)=>{
  res.set({
    'Content-Type':'text/event-stream',
    'Cache-Control':'no-cache',
    'Connection':'keep-alive'
  });
  res.flushHeaders();
  clients.push(res);
  req.on('close',()=>{ clients = clients.filter(c=>c!==res); });
});

// webhook endpoint
app.post('/webhook',(req,res)=>{
  const { order_id, amount, status, payment_method } = req.body;
  transactions[order_id] = { amount,status,payment_method };
  clients.forEach(c=>c.write(`data: ${JSON.stringify({order_id,amount,status,payment_method})}\n\n`));
  res.status(200).send('OK');
});

// fallback polling
app.get('/check',async (req,res)=>{
  const { order_id, amount } = req.query;
  try{
    const response = await fetch(`https://app.pakasir.com/api/transactiondetail?project=${slug}&amount=${amount}&order_id=${order_id}&api_key=${api_key}`);
    const data = await response.json();
    transactions[order_id]=data;
    res.json(data);
  }catch(err){ res.json({status:'error',message:err.message}); }
});

app.listen(port,()=>console.log(`ANONAUTOPAYMENT realtime jalan di http://localhost:${port}`));
