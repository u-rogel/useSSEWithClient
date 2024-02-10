import React, { useCallback, useEffect } from 'react'
import { Room, User } from './types'
import useStateRef from 'react-usestateref'

interface UsersProps {
  roomId: Room['id']
  sse: EventSource
}

const Users: React.FC<UsersProps> = ({ roomId, sse }) => {
  const [users, setUsers] = useStateRef<User[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newData = useCallback((data: MessageEvent<string>) => {
    const res: { type: 'INIT' | 'EDIT', data: User[] } = JSON.parse(data.data); 

    if (res.type === 'INIT') {
      setUsers(res.data)
    } else if (res.type === 'EDIT') {
      setUsers(res.data)
    }
  }, [roomId])

  useEffect(() => {
    sse.addEventListener('rooms/users', newData);
    fetch(
      `http://localhost:3001/rooms/users/get?roomId=${roomId}`,
      {
        headers: {
          'User-Id': localStorage.getItem('userId')!
        }
      }
    )
      .then((res) => res.json())
        
    return () => {
      setUsers([])
      sse.removeEventListener('rooms/users', newData)
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