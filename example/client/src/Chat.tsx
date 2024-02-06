import React from 'react'
import Messages from './Messages'
import { User } from './types'
import Users from './Users'
import Rooms from './Rooms'

interface ChatProps {
  userId: User['id']
}


const Chat: React.FC<ChatProps> = ({ userId }) => {
  return (
    <div>
      <h2>Simple Chat</h2>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
        <Rooms userId={userId} />
        <Messages userId={userId} />
        <Users />
      </div>
    </div>
  )
}

export default Chat