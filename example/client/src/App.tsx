import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  useEffect(() => {
    fetch('http://localhost:3001/rooms')
      .then((res) => res.json())
      .then((rooms) => {
        console.log({ rooms });
        setRooms(rooms)
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3001/users')
      .then((res) => res.json())
      .then((users) => {
        console.log({ users });
        setUsers(users)
      })
  }, [])

  useEffect(() => {
    fetch('http://localhost:3001/messages')
      .then((res) => res.json())
      .then((messages) => {
        console.log({ messages });
        setMessages(messages)
      })
  }, [])

  // useEffect(() => {
  //   fetch('http://localhost:3001/users', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ username: 'new user' })
  //   })
  //     .then((res) => res.json())
  //     .then((messages) => {
  //       console.log({ messages });
  //     })
  // }, [])

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div style={{ width: '400px' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
          <div>
            <h3>Users</h3>
            <div>
              {users.map((user) => (
                <div key={user.id}>
                  {user.username}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Rooms</h3>
            <div>
              {rooms.map((room) => (
                <div key={room.id}>
                  {room.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Messages</h3>
            <div>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.message}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
