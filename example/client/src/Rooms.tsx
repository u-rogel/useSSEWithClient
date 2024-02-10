import React, { useCallback, useEffect, useState } from 'react'
import { Room, User } from './types'
import useStateRef from 'react-usestateref'

interface RoomsProps {
  userId: User['id']
  selectedRoomId: Room['id'] | null
  onRoomSelect: (roomId: Room['id']) => void
  sse: EventSource
}

const Rooms: React.FC<RoomsProps> = ({ userId, selectedRoomId, onRoomSelect, sse }) => {
  const [rooms, setRooms, roomsRef] = useStateRef<Omit<Room, 'userIds'>[]>([])
  const [newRoom, setNewRoom] = useState('')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newData = useCallback((data: MessageEvent<string>) => {
    console.log({ data });
    const res: { type: 'INIT' | 'ADD', data: Room[] } = JSON.parse(data.data);
    console.log({ res });

    if (res.type === 'INIT') {
      setRooms(res.data)
    } else if (res.type === 'ADD') {
      setRooms([...roomsRef.current, ...res.data])
    }
  }, [])

  useEffect(() => {
    sse.addEventListener('rooms', newData)
    fetch(
      'http://localhost:3001/rooms/get',
      {
        headers: {
          'User-Id': localStorage.getItem('userId')!
        }
      }
    )
      .then<{ success: boolean }>((res) => res.json())
      .then((res) => {
        if (!res.success) {
          sse.removeEventListener('rooms', newData)
        }
      })
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
                      selectedRoomId != null
                        ? fetch(
                          'http://localhost:3001/rooms/users/leave',
                          {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'User-Id': localStorage.getItem('userId')!
                            },
                            body: JSON.stringify({ roomId: selectedRoomId })
                          }
                        )
                          .then((res) => res.json())
                        : Promise.resolve(),
                      fetch(
                        'http://localhost:3001/rooms/users/join',
                        {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'User-Id': localStorage.getItem('userId')!
                          },
                          body: JSON.stringify({ roomId: room.id })
                        }
                      )
                        .then((res) => res.json()),
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
              'http://localhost:3001/rooms/new',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Id': localStorage.getItem('userId')!
                },
                body: JSON.stringify({ userId, name: newRoom })
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