import express, { type Request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// let counter1 = 0;
// const interValID1 = setInterval(() => {
//   counter1++;
//   if (counter1 >= 10) {
//     clearInterval(interValID1);
//     res.end();
//     return;
//   }
//   res.write('event: ping\n');
//   res.write(`data: ${JSON.stringify({ num: counter1 })}\n\n`);
// }, 3000);

interface User {
  id: number
  username: string
  roomsId: number[]
}

interface Message {
  id: number
  message: string
  roomId: number
  userId: number
}

interface Room {
  id: number
  name: string
}

app.get('/sse-register', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client

  res.on('close', () => {
    console.log('client dropped me');
    res.end();
  });
});

app.get('/rooms', async (req, res) => {
  const rooms = await fetch('http://localhost:3000/rooms').then<Room[]>((r) => r.json());

  res.status(200).json(rooms).send();
});

app.post('/rooms', async (req: Request<unknown, unknown, Pick<Room, 'name'>>, res) => {
  const { name } = req.body;
  const rooms = await fetch('http://localhost:3000/rooms').then<Room[]>((r) => r.json());
  const foundRoom = rooms.find((room) => room.name === name);
  if (foundRoom != null) {
    res.status(200).json(foundRoom).send();
  } else {
    const newRoom = await fetch(
      'http://localhost:3000/rooms',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      },
    ).then<Room>((r) => r.json());

    res.status(200).json(newRoom).send();
  }
});

app.get('/users', async (req, res) => {
  const users = await fetch('http://localhost:3000/users').then<User[]>((r) => r.json());

  res.status(200).json(users).send();
});

app.post('/users', async (req: Request<unknown, unknown, Pick<User, 'username'>>, res) => {
  const { username } = req.body;
  const users = await fetch('http://localhost:3000/users').then<User[]>((r) => r.json());
  const foundUser = users.find((user) => user.username === username);
  if (foundUser != null) {
    res.status(200).json(foundUser).send();
  } else {
    const newUser = await fetch(
      'http://localhost:3000/users',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, roomIds: [1] }),
      },
    ).then<User>((r) => r.json());

    res.status(200).json(newUser).send();
  }
});

app.get('/messages', async (req, res) => {
  const messages = await fetch('http://localhost:3000/messages').then<Message[]>((r) => r.json());

  res.status(200).json(messages).send();
});

app.post('/messages', async (req: Request<unknown, unknown, Pick<Message, 'roomId' | 'message' | 'userId'>>, res) => {
  const { roomId, userId, message } = req.body;
  const newMessage = await fetch('http://localhost:3000/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, roomId, userId }),
  }).then<Message>((r) => r.json());

  res.status(200).json(newMessage).send();
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
