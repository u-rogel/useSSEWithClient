## Express SSE Server

### Sign In & Login

To sign-in or to login you need only username. Endpoint is `[POST] - users`.

```.ts
fetch(
  'http://localhost:3001/users',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username })
  }
)
```

## Register to SSE

The server sends data on a single channel. The endpoint is `[GET] - /sse-register`.

```.ts
new EventSource(`http://localhost:3001/sse-register?userId=${userId}`)
```


## SSE Events

1. rooms - the chat rooms, with two types: `INIT` and `ADD`

    - registering on `[GET] - /rooms/get`
    ```.ts
    fetch(
      'http://localhost:3001/rooms/get',
      {
        headers: {
          'User-Id': userId
        }
      }
    )
    ```

    - listening
    ```.ts
    sse.addEventListener('rooms', newData)
    ```

2. room/users - the chat users of a room, with two types: `INIT` and `EDIT`

    - registering on `[GET] - /rooms/users/get?roomId={roomId}`
    ```.ts
    fetch(
      `http://localhost:3001/rooms/users/get?roomId=${roomId}`,
      {
        headers: {
          'User-Id': userId
        }
      }
    )
    ```

    - listening
    ```.ts
    sse.addEventListener('rooms/users', newData)
    ```

3. room/messages - the chat users of a room, with two types: `INIT` and `ADD`

    - registering on `[GET] - /rooms/messages/get?roomId={roomId}`
    ```.ts
    fetch(
      `http://localhost:3001/rooms/users/get?roomId=${roomId}`,
      {
        headers: {
          'User-Id': userId
        }
      }
    )
    ```

    - listening
    ```.ts
    sse.addEventListener('rooms/messages', newData)
    ```


## Data Mutating Endpoints

1. create room - creating a new chat room `[POST] - /rooms/new`

    ```.ts
    fetch(
      'http://localhost:3001/rooms/new',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId
        },
        body: JSON.stringify({ userId, name })
      }
    )
    ```

2. join room - joining a new chat room `[PATCH] - /rooms/users/join`

    ```.ts
    fetch(
      'http://localhost:3001/rooms/users/join',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId
        },
        body: JSON.stringify({ roomId })
      }
    )
    ```

3. leave room - leaving a new chat room `[PATCH] - /rooms/users/leave`

    ```.ts
    fetch(
      'http://localhost:3001/rooms/users/leave',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId
        },
        body: JSON.stringify({ roomId })
      }
    )
    ```

4. send message - sending a message to chat room `[POST] - /rooms/messages/new`

    ```.ts
    fetch(
      'http://localhost:3001/rooms/messages/new',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Id': userId
        },
        body: JSON.stringify({ message, roomId })
      }
    )
    ```