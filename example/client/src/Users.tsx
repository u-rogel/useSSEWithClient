import React, { useEffect, useState } from 'react'
import { Room, User } from './types'

interface UsersProps {
  roomId: Room['id']
}

const Users: React.FC<UsersProps> = ({ roomId }) => {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    console.log({ roomId });

    const intervalId = setInterval(() => {
      fetch(`http://localhost:3001/users?roomId=${roomId}`)
        .then<User[]>((res) => res.json())
        .then((res) => {
          setUsers(res)
        })
    }, 3000)
    return () => {
      setUsers([])
      clearInterval(intervalId)
    }
  }, [roomId])
  return (
    <div style={{ border: '1px solid black', flex: 1, minHeight: '200px' }}>
      <h4>Users</h4>
      <div>
        {
          users.map((user) => {
            return (
              <div key={user.id} style={{ display: 'flex', padding: '10px' }}>
                <span style={{ color: '#7f7f7f', width: '100px', textAlign: 'end' }}>
                  {user.username}:
                </span>
                <span style={{ marginLeft: '25px' }}>
                  {user.id}
                </span>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export default Users