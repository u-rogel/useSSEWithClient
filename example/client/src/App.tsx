import { useEffect, useState } from 'react'
import './App.css'
import { User } from './types'
import Login from './Login'
import Chat from './Chat'

function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const localUser = localStorage.getItem('user')
    if (localUser != null) {
      const foundLocalUser = JSON.parse(localUser) as Pick<User, 'id' | 'username'>
      console.log({ foundLocalUser });

      fetch(
        'http://localhost:3001/users',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: foundLocalUser.id })
        }
      ).then((res) => res.json())
        .then((res) => {
          setUser(res);
        })
        .catch((err) => {
          console.log({ err });
        })
    }
  }, [])

  if (user == null) {
    return (
      <Login
        onLogin={(user) => {
          localStorage.setItem('user', JSON.stringify({ id: user.id }))
          setUser(user)
        }} />
    )
  }

  return (
    <Chat userId={user.id} />
  )
}

export default App
