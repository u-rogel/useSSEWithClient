import React, { useEffect, useState } from 'react'
import { User } from './types'

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
    setInterval(() => {
      fetch('http://localhost:3001/users')
        .then<User[]>((res) => res.json())
        .then((res) => {
          setUsers(res)
        })
    }, 3000)
  }, [])
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