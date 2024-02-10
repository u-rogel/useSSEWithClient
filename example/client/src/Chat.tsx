import React, { useState } from 'react'
import Messages from './Messages'
import { Room, User } from './types'
import Users from './Users'
import Rooms from './Rooms'

interface ChatProps {
  userId: User['id']
  sse: EventSource
}


const Chat: React.FC<ChatProps> = ({ userId, sse }) => {
  const [selectedRoomId, setSelectedRoomId] = useState<null | Room['id']>(null)
  return (
    <div>
      <h2>Simple Chat</h2>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <Rooms
          sse={sse}
          userId={userId}
          onRoomSelect={(roomId) => { setSelectedRoomId(roomId) }}
          selectedRoomId={selectedRoomId}
        />
        {
          selectedRoomId != null
            ? (
              <>
                <Messages sse={sse} roomId={selectedRoomId} />
                <Users sse={sse} roomId={selectedRoomId} />
              </>
            )
            : (
              <div style={{ border: '1px solid black', flex: 4, minHeight: '200px' }}>
                select a room first
              </div>
            )
        }
      </div>
    </div>
  )
}

export default Chat