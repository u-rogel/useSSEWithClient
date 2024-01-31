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

  let counter1 = 0;
  let interValID1 = setInterval(() => {
      counter1++;
      if (counter1 >= 10) {
          clearInterval(interValID1);
          res.end();
          return;
      }
      res.write('event: slow\n')
      res.write(`data: ${JSON.stringify({num: counter1})}\n\n`);
  }, 3000);

  // let counter2 = 0;
  // let interValID2 = setInterval(() => {
  //   counter2++;
  //   if (counter2 >= 30) {
  //       clearInterval(interValID2);
  //       res.end();
  //       return;
  //   }
  //   res.write('event: fast\n')
  //   res.write(`data: ${JSON.stringify({num: counter2})}\n\n`);
  // }, 1000);

  res.on('close', () => {
      console.log('client dropped me');
      clearInterval(interValID1);
      // clearInterval(interValID2);
      res.end();
  });
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})