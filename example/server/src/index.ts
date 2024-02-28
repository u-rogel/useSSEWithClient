import express, { type Response, type Request } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { type Sub, type MessageType, type RoomType, type UserType, type AllowedEvent } from 'types';
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

app.post('/users', async (req: Request<unknown, unknown, Pick<Partial<UserType>, 'username' | 'id'>>, res) => {
  const { username, id } = req.body;

  let foundUser: UserType | null = null;
  if (id != null) {
    foundUser = await jsonServerFetch<UserType>(`users/${id}`);
  }
  if (username != null) {
    foundUser = await jsonServerFetch<UserType[]>(`users?username=${username}`).then((r) => r[0]);
  }
  if (foundUser != null) {
    res.status(200).json(foundUser);
  } else {
    const newUser = await jsonServerFetch<UserType>(
      'users',
      'POST',
      { username },
    );

    res.status(200).json(newUser);
  }
});

const getRoomUsers = async (room: RoomType) => {
  const users = await jsonServerFetch<UserType[]>('users');
  return room.userIds.map((roomUserId) => users.find((user) => user.id === roomUserId)!);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents
const sseConnections: Array<{ id: number, userId: UserType['id'], connection: Response, subs: Array<Sub<AllowedEvent>> }> = [];
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
    destroySSE(connectionId)
      .then(() => {
        res.end();
      });
  });
  return res;
};

const destroySSE = async (connectionId: number) => {
  const connectionIdx = sseConnections.findIndex((connection) => connection.id === connectionId);
  const [connectionToDestroy] = sseConnections.splice(connectionIdx, 1);
  const subRoomToLeave = connectionToDestroy.subs.find((sub) => { return /rooms\/\d+\/users/.test(sub.event) && sub.path === 'init'; });

  if (subRoomToLeave != null) {
    const roomId = +subRoomToLeave.event.replace('rooms/', '').replace('/users', '');
    const draftRoom = await jsonServerFetch<RoomType>(`rooms/${roomId}`);
    const userIdxInRoom = draftRoom.userIds.findIndex((usrId) => usrId === connectionToDestroy.userId);
    const nextUserIds = [...draftRoom.userIds.slice(0, userIdxInRoom), ...draftRoom.userIds.slice(userIdxInRoom + 1)];
    const { userIds, ...editedRoom } = await jsonServerFetch<RoomType>(
      `rooms/${roomId}`,
      'PATCH',
      { userIds: nextUserIds },
    );
    const roomUsers = await getRoomUsers({ userIds, ...editedRoom });
    publishRoomUsers({
      sub: { event: `rooms/${roomId}/users`, path: 'leave' },
      message: { type: 'EDIT', data: roomUsers },
    });
  }
};

const addSub = <Event extends AllowedEvent>({ userId, sub }: { userId: number, sub: Sub<Event> }) => {
  const sseConnIdx = sseConnections.findIndex((connection) => connection.userId === userId);
  const sseConn = sseConnections[sseConnIdx];
  sseConn.subs = [...sseConn.subs, sub];
};

const dropSub = <Event extends AllowedEvent>({ userId, sub: subToDrop }: { userId: number, sub: Sub<Event> }) => {
  const sseConnIdx = sseConnections.findIndex((connection) => connection.userId === userId);
  const sseConn = sseConnections[sseConnIdx];
  const dropIdx = sseConn.subs.findIndex((sub) => sub.event === subToDrop.event && sub.path === subToDrop.path);
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
          return sub.event === broadSub.event && sub.path === broadSub.path;
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
      data: RoomType[]
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
    sub: Sub<`rooms/${number}/users`>
    message: {
      data: UserType[]
      type: 'INIT' | 'ADD' | 'EDIT' | 'DELETE'
    }
  },
) => {
  broadcastEvent({ event: sub.event, message, userId, sub });
};

const publishRoomMessages = (
  {
    userId,
    message,
    sub,
  }: {
    userId?: number
    sub: Sub<`rooms/${number}/messages`>
    message: {
      data: Array<MessageType & Pick<UserType, 'username'>>
      type: 'INIT' | 'ADD'
    }
  },
) => {
  broadcastEvent({ event: sub.event, message, userId, sub });
};

app.get('/sse-register', (req: Request<unknown, unknown, unknown, { userId: number }>, res) => {
  createSSE(req, res);
});

app.get('/rooms/stream', async (req, res) => {
  const userId = +req.header('User-Id')!;
  const draftRooms = await jsonServerFetch<RoomType[]>('rooms');
  addSub({ userId, sub: { event: 'rooms', path: 'init' } });
  addSub({ userId, sub: { event: 'rooms', path: 'new' } });
  publishRooms({
    userId,
    sub: { event: 'rooms', path: 'init' },
    message: { type: 'INIT', data: draftRooms },
  });

  res.status(200).json({ success: true });
});

app.post('/rooms/new', async (req: Request<unknown, unknown, Pick<RoomType, 'name'>>, res) => {
  const { name } = req.body;
  const rooms = await jsonServerFetch<RoomType[]>('rooms');
  const foundRoom = rooms.find((room) => room.name === name);
  if (foundRoom != null) {
    res.status(200).json({ success: false });
  } else {
    const newRoom = await jsonServerFetch<RoomType>(
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

app.get('/rooms/:roomId/users/stream', async (req: Request<{ roomId: string }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId: roomIdStr } = req.params;
  const roomId = +roomIdStr;
  const room = await jsonServerFetch<RoomType>(`rooms/${roomId}`);

  addSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'init' } });
  addSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'join' } });
  addSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'leave' } });
  const users = await getRoomUsers(room);
  publishRoomUsers({
    userId,
    sub: { event: `rooms/${roomId}/users`, path: 'init' },
    message: {
      type: 'INIT',
      data: users,
    },
  });
  res.status(200).json({ success: true });
});

app.patch('/rooms/:roomId/users/join', async (req: Request<{ roomId: string }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId: roomIdStr } = req.params;
  const roomId = +roomIdStr;

  const draftRoom = await jsonServerFetch<RoomType>(`rooms/${roomId}`);
  const editedRoom = await jsonServerFetch<RoomType>(
    `rooms/${roomId}`,
    'PATCH',
    { userIds: [...draftRoom.userIds, userId] },
  );

  const roomUsers = await getRoomUsers(editedRoom);
  publishRoomUsers({
    sub: { event: `rooms/${roomId}/users`, path: 'join' },
    message: { type: 'EDIT', data: roomUsers },
  });
  res.status(200).json({ success: true });
});

app.patch('/rooms/:roomId/users/leave', async (req: Request<{ roomId: string }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId: roomIdStr } = req.params;
  const roomId = +roomIdStr;

  const draftRoom = await jsonServerFetch<RoomType>(`rooms/${roomId}`);
  const userIdxInRoom = draftRoom.userIds.findIndex((usrId) => usrId === userId);
  const nextUserIds = [...draftRoom.userIds.slice(0, userIdxInRoom), ...draftRoom.userIds.slice(userIdxInRoom + 1)];
  dropSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'init' } });
  dropSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'join' } });
  dropSub({ userId, sub: { event: `rooms/${roomId}/users`, path: 'leave' } });
  dropSub({ userId, sub: { event: `rooms/${roomId}/messages`, path: 'new' } });
  dropSub({ userId, sub: { event: `rooms/${roomId}/messages`, path: 'init' } });

  const { userIds, ...editedRoom } = await jsonServerFetch<RoomType>(
    `rooms/${roomId}`,
    'PATCH',
    { userIds: nextUserIds },
  );

  const roomUsers = await getRoomUsers({ userIds, ...editedRoom });
  publishRoomUsers({
    sub: { event: `rooms/${roomId}/users`, path: 'leave' },
    message: { type: 'EDIT', data: roomUsers },
  });
  res.status(200).json({ success: true });
});

app.get('/rooms/:roomId/messages/stream', async (req: Request<{ roomId: string }>, res) => {
  const userId = +req.header('User-Id')!;
  const { roomId: roomIdStr } = req.params;
  const roomId = +roomIdStr;
  const messages = await jsonServerFetch<MessageType[]>(`messages?roomId=${roomId}`);
  const users = await jsonServerFetch<UserType[]>('users');

  addSub({ userId, sub: { event: `rooms/${roomId}/messages`, path: 'init' } });
  addSub({ userId, sub: { event: `rooms/${roomId}/messages`, path: 'new' } });
  publishRoomMessages({
    userId,
    sub: { event: `rooms/${roomId}/messages`, path: 'init' },
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

app.post('/rooms/:roomId/messages/new', async (req: Request<{ roomId: string }, unknown, Pick<MessageType, 'message'>>, res) => {
  const userId = +req.header('User-Id')!;
  const { message } = req.body;
  const { roomId: roomIdStr } = req.params;
  const roomId = +roomIdStr;
  const newMessage = await jsonServerFetch<MessageType>(
    'messages',
    'POST',
    { message, roomId, userId },
  );
  const user = await jsonServerFetch<UserType>(`users/${userId}`);

  publishRoomMessages({
    sub: { event: `rooms/${roomId}/messages`, path: 'new' },
    message: { type: 'ADD', data: [{ ...newMessage, username: user.username }] },
  });

  res.status(200).json({ success: true });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
