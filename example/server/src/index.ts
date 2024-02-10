import express, { type Response, type Request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { type Sub, type Message, type Room, type User, type AllowedEvent } from 'types';
const app = express();

app.use(cors());
app.use(bodyParser.json());

const port = 3001;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const jsonServerFetch = async <Res>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: Record<string, any>,
) => {
  return fetch(
    `http://localhost:3000/${path}`,
    {
      method,
      ...(() => {
        if (body != null) {
          return {
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
          };
        }
        return {};
      })(),
    },
  )
    .then<Res>((r) => r.json());
};

const getRoomUsers = async (room: Room) => {
  const users = await jsonServerFetch<User[]>('users');
  return room.userIds.map((roomUserId) => users.find((user) => user.id === roomUserId)!);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
const sseConnections: Array<{ id: number, userId: User['id'], connection: Response, subs: Array<Sub<AllowedEvent>> }> = [];
let sseConnectionId = 1;

const createSSE = (req: Request<unknown, unknown, unknown, { userId: number }>, res: Response) => {
  const { userId: userIdStr } = req.query;
  const userId = +userIdStr;

  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // flush the headers to establish SSE with client
  const connectionId = sseConnectionId;
  sseConnections.push({ connection: res, id: connectionId, userId, subs: [] });
  sseConnectionId++;
  res.on('close', () => {
    console.log('client dropped me');
    res.end();
    const connectionIdx = sseConnections.findIndex((connection) => connection.id === connectionId);
    sseConnections.splice(connectionIdx, 1);
  });
  return res;
};

const addSub = <Event extends AllowedEvent>({ userId, sub }: { userId: number, sub: Sub<Event> }) => {
  const sseConnIdx = sseConnections.findIndex((connection) => connection.userId === userId);
  const sseConn = sseConnections[sseConnIdx];
  sseConn.subs = [...sseConn.subs, sub];
};

const dropSub = <Event extends AllowedEvent>({ userId, sub: subToDrop }: { userId: number, sub: Sub<Event> }) => {
  const sseConnIdx = sseConnections.findIndex((connection) => connection.userId === userId);
  const sseConn = sseConnections[sseConnIdx];
  const dropIdx = sseConn.subs.findIndex((sub) => sub.event === subToDrop.event && sub.path === subToDrop.path && sub.id === subToDrop.id);
  sseConn.subs.splice(dropIdx, 1);
};

const broadcastEvent = <Event extends AllowedEvent>(
  {
    userId,
    sub: broadSub,
    event,
    message,
  }: {
    userId?: number
    sub: Sub<Event>
    event: Event
    message: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: Record<string, any>
      type: 'INIT' | 'ADD' | 'EDIT' | 'DELETE'
    }
  },
) => {
  if (userId != null) {
    const sseConnIdx = sseConnections.findIndex((connection) => connection.userId === userId);
    const sseConn = sseConnections[sseConnIdx].connection;
    sseConn.write(`event: ${event}\n`);
    sseConn.write(`data: ${JSON.stringify(message)}\n\n`);
  } else {
    sseConnections.forEach((sseConnection) => {
      if (
        sseConnection.subs.find((sub) => {
          return sub.event === broadSub.event && sub.path === broadSub.path && sub.id === broadSub.id;
        }) != null
      ) {
        sseConnection.connection.write(`event: ${event}\n`);
        sseConnection.connection.write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });
  }
};

const publishRooms = (
  {
    userId,
    message,
    sub,
  }: {
    userId?: number
    sub: Sub<'rooms'>
    message: {
      data: Room[]
      type: 'INIT' | 'ADD'
    }
  },
) => {
  broadcastEvent({ event: 'rooms', message, userId, sub });
};

const publishRoomUsers = (
  {
    userId,
    message,
    sub,
  }: {
    userId?: number
    sub: Sub<'rooms/users'>
    message: {
      data: User[]
      type: 'INIT' | 'ADD' | 'EDIT' | 'DELETE'
    }
  },
) => {
  broadcastEvent({ event: 'rooms/users', message, userId, sub });
};

const publishRoomMessages = (
  {
    userId,
    message,
    sub,
  }: {
    userId?: number
    sub: Sub<'rooms/messages'>
    message: {
      data: Array<Message & Pick<User, 'username'>>
      type: 'INIT' | 'ADD'
    }
  },
) => {
  broadcastEvent({ event: 'rooms/messages', message, userId, sub });
};

app.get('/sse-register', (req: Request<unknown, unknown, unknown, { userId: number }>, res) => {
  createSSE(req, res);
});

app.get('/rooms/get', async (req, res) => {
  const userId = +req.header('User-Id')!;

  const draftRooms = await jsonServerFetch<Room[]>('rooms');
  addSub({ userId, sub: { event: 'rooms', path: 'init' } });
  addSub({ userId, sub: { event: 'rooms', path: 'new' } });
  publishRooms({
    userId,
    sub: { event: 'rooms', path: 'init' },
    message: { type: 'INIT', data: draftRooms },
  });

  res.status(200).json({ success: true });
});

app.post('/rooms/new', async (req: Request<unknown, unknown, Pick<Room, 'name'>>, res) => {
  const { name } = req.body;
  const rooms = await jsonServerFetch<Room[]>('rooms');
  const foundRoom = rooms.find((room) => room.name === name);
  if (foundRoom != null) {
    res.status(200).json({ success: false });
  } else {
    const newRoom = await jsonServerFetch<Room>(
      'rooms',
      'POST',
      { name, userIds: [] },
    );

    publishRooms({
      sub: { event: 'rooms', path: 'new' },
      message: { type: 'ADD', data: [newRoom] },
    });
    res.status(200).json({ success: true });
  }
});

app.patch('/rooms/join', async (req: Request<unknown, unknown, { id: Room['id'] }>, res) => {
  const userId = +req.header('User-Id')!;
  const { id } = req.body;
  const draftRoom = await jsonServerFetch<Room>(`rooms/${id}`);
  const editedRoom = await jsonServerFetch<Room>(
    `rooms/${id}`,
    'PATCH',
    { userIds: [...draftRoom.userIds, userId] },
  );

  const roomUsers = await getRoomUsers(editedRoom);
  publishRoomUsers({
    sub: { event: 'rooms/users', path: 'join', id: editedRoom.id },
    message: { type: 'EDIT', data: roomUsers },
  });
  res.status(200).json({ success: true });
});

app.patch('/rooms/leave', async (req: Request<unknown, unknown, { id: Room['id'] }>, res) => {
  const userId = +req.header('User-Id')!;
  const { id } = req.body;
  const draftRoom = await jsonServerFetch<Room>(`rooms/${id}`);
  const userIdxInRoom = draftRoom.userIds.findIndex((usrId) => usrId === userId);
  const nextUserIds = [...draftRoom.userIds.slice(0, userIdxInRoom), ...draftRoom.userIds.slice(userIdxInRoom + 1)];
  dropSub({ userId, sub: { event: 'rooms/users', path: 'init', id } });
  dropSub({ userId, sub: { event: 'rooms/users', path: 'join', id } });
  dropSub({ userId, sub: { event: 'rooms/users', path: 'leave', id } });
  dropSub({ userId, sub: { event: 'rooms/messages', path: 'new', id } });
  dropSub({ userId, sub: { event: 'rooms/messages', path: 'init', id } });

  const { userIds, ...editedRoom } = await jsonServerFetch<Room>(
    `rooms/${id}`,
    'PATCH',
    { userIds: nextUserIds },
  );

  const roomUsers = await getRoomUsers({ userIds, ...editedRoom });
  publishRoomUsers({
    sub: { event: 'rooms/users', path: 'leave', id: editedRoom.id },
    message: { type: 'EDIT', data: roomUsers },
  });
  res.status(200).json({ success: true });
});

app.get('/rooms/users/get', async (req: Request<unknown, unknown, unknown, { roomId: Room['id'] }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId } = req.query;

  const room = await jsonServerFetch<Room>(`rooms/${roomId}`);

  addSub({ userId, sub: { event: 'rooms/users', path: 'init', id: room.id } });
  addSub({ userId, sub: { event: 'rooms/users', path: 'join', id: room.id } });
  addSub({ userId, sub: { event: 'rooms/users', path: 'leave', id: room.id } });
  const users = await getRoomUsers(room);
  publishRoomUsers({
    sub: { event: 'rooms/users', path: 'init', id: room.id },
    message: {
      type: 'EDIT',
      data: users,
    },
  });
  res.status(200).json({ success: true });
});

app.post('/users', async (req: Request<unknown, unknown, Pick<Partial<User>, 'username' | 'id'>>, res) => {
  const { username, id } = req.body;

  let foundUser: User | null = null;
  if (id != null) {
    foundUser = await jsonServerFetch<User>(`users/${id}`);
  }
  if (username != null) {
    foundUser = await jsonServerFetch<User[]>(`users?username=${username}`).then((r) => r[0]);
  }
  if (foundUser != null) {
    res.status(200).json(foundUser);
  } else {
    const newUser = await jsonServerFetch<User>(
      'users',
      'POST',
      { username },
    );

    res.status(200).json(newUser);
  }
});

app.get('/rooms/messages', async (req: Request<unknown, unknown, unknown, { roomId: string }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId: roomIdStr } = req.query;
  const roomId = +roomIdStr;
  const messages = await jsonServerFetch<Message[]>(`messages?roomId=${roomId}`);
  const users = await jsonServerFetch<User[]>('users');

  addSub({ userId, sub: { event: 'rooms/messages', path: 'init', id: roomId } });
  addSub({ userId, sub: { event: 'rooms/messages', path: 'new', id: roomId } });
  publishRoomMessages({
    userId,
    sub: { event: 'rooms/messages', path: 'init', id: roomId },
    message: {
      type: 'INIT',
      data: messages.map((message) => {
        const foundUser = users.find((user) => user.id === message.userId)!;
        return ({ ...message, username: foundUser.username });
      }),
    },
  });

  res.status(200).json({ success: true });
});

app.post('/rooms/messages/new', async (req: Request<unknown, unknown, Pick<Message, 'roomId' | 'message'>>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId, message } = req.body;

  const newMessage = await jsonServerFetch<Message>(
    'messages',
    'POST',
    { message, roomId, userId },
  );
  const user = await jsonServerFetch<User>(`users/${userId}`);

  publishRoomMessages({
    sub: { event: 'rooms/messages', path: 'new', id: roomId },
    message: { type: 'ADD', data: [{ ...newMessage, username: user.username }] },
  });

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
