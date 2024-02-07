import React, { useEffect, useState } from 'react'
import { Room, User } from './types'

interface RoomsProps {
  userId: User['id']
  selectedRoomId: Room['id'] | null
  onRoomSelect: (roomId: Room['id']) => void
}

const Rooms: React.FC<RoomsProps> = ({ userId, selectedRoomId, onRoomSelect }) => {
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
                <span
                  onClick={() => {
                    Promise.all([
                      fetch(
                        'http://localhost:3001/rooms/join',
                        {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ id: room.id, userId })
                        }
                      )
                        .then((res) => res.json()),
                      selectedRoomId != null
                        ? fetch(
                          'http://localhost:3001/rooms/leave',
                          {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ id: selectedRoomId, userId })
                          }
                        )
                          .then((res) => res.json())
                        : Promise.resolve(),
                    ])
                      .then(() => {
                        onRoomSelect(room.id)
                      })
                  }}
                  style={{ color: '#7f7f7f', width: '100px', textAlign: 'end' }}>
                  {room.name}:
                </span>
                {
                  selectedRoomId === room.id && (
                    <span style={{ marginLeft: '25px' }}>
                      {'<='}
                    </span>
                  )
                }
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