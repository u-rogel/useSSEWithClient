import { useEffect, useState } from 'react'
import './App.css'
import { User } from './types'
import Login from './Login'
import Chat from './Chat'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [sseConn, setSseConn] = useState<EventSource | null>(null)

  useEffect(() => {
    const localUser = localStorage.getItem('userId')
    if (localUser != null) {
      const foundLocalUserId = +localUser

      fetch(
        'http://localhost:3001/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: foundLocalUserId })
        }
      ).then<User>((res) => res.json())
        .then((res) => {

          const sse = new EventSource(`http://localhost:3001/sse-register?userId=${res.id}`)
          sse.onopen = () => {
            console.log('SSE Opened');
            
          }
          setSseConn(sse)
          setUser(res);
        })
        .catch((err) => {
          console.log({ err });
        })
    }
  }, [])

  if (user == null || sseConn == null) {
    return (
      <Login
        onLogin={(user, sse) => {
          localStorage.setItem('userId', `${user.id}`)
          setUser(user)
          setSseConn(sse)
        }} />
    )
  }

  return (
    <Chat userId={user.id} sse={sseConn} />
  )
}

export default App
