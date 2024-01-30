const express = require('express')
var cors = require('cors')
var app = express()

app.use(cors())

const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/sse-register', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  let counter = 0;
  let interValID = setInterval(() => {
      counter++;
      if (counter >= 10) {
          clearInterval(interValID);
          res.end(); // terminates SSE session
          return;
      }
      res.write(`data: ${JSON.stringify({num: counter})}\n\n`); // res.write() instead of res.send()
  }, 1000);

  // If client closes connection, stop sending events
  res.on('close', () => {
      console.log('client dropped me');
      clearInterval(interValID);
      res.end();
  });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})