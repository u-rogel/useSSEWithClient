import React, { useEffect, useState } from 'react'
import { Room, User } from './types'

interface RoomsProps {
  userId: User['id']
}

const Rooms: React.FC<RoomsProps> = ({ userId }) => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoom, setNewRoom] = useState('')

  useEffect(() => {
    setInterval(() => {
      fetch('http://localhost:3001/rooms')
        .then<Room[]>((res) => res.json())
        .then((res) => {
          setRooms(res)
        })
    }, 3000)
  }, [])
  return (
    <div style={{ border: '1px solid black', flex: 1, minHeight: '200px' }}>
      <h4>Rooms</h4>
      <div>
        {
          rooms.map((room) => {
            return (
              <div key={room.id} style={{ display: 'flex', padding: '10px' }}>
                <span style={{ color: '#7f7f7f', width: '100px', textAlign: 'end' }}>
                  {room.name}:
                </span>
                <span style={{ marginLeft: '25px' }}>
                  {'<='}
                </span>
              </div>
            )
          })
        }
      </div>
      <div>
        <input
          type="text"
          value={newRoom}
          onChange={(e) => setNewRoom(e.target.value)}
        />
        <button
          onClick={() => {
            fetch(
              'http://localhost:3001/rooms',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, name: newRoom, roomId: 1 })
              }
            )
              .then<{ success: boolean }>((res) => res.json())
              .then((res) => {
                if (res.success) {
                  setNewRoom('')
                } else {
                  console.log('room already exists');
                  setNewRoom('')
                }
              })
          }}
        >add room</button>
      </div>
    </div>
  )
}

export default Rooms