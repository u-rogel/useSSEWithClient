import React from 'react'
import Messages from './Messages'
import { User } from './types'

interface ChatProps {
  userId: User['id']
}


const Chat: React.FC<ChatProps> = ({ userId }) => {
  return (
    <div>
      <h2>Simple Chat</h2>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <div style={{ border: '1px solid black', flex: 1, minHeight: '200px' }}>
          <h4>Rooms</h4>
        </div>
        <Messages userId={userId} />
        <div style={{ border: '1px solid black', flex: 1, minHeight: '200px' }}>
          <h4>Users</h4>
        </div>
      </div>
    </div>
  )
}

export default Chat