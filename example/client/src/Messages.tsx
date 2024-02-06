import React, { useEffect, useState } from 'react'
import { Message, User } from './types'

type ChatMessage = Message & Pick<User, 'username'>

interface MessagesProps {
  userId: User['id']
}

const Messages: React.FC<MessagesProps> = ({ userId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [message, setMessage] = useState('')
  useEffect(() => {
    setInterval(() => {
      fetch('http://localhost:3001/messages')
        .then<ChatMessage[]>((res) => res.json())
        .then((res) => {
          setMessages(res)
        })
    }, 3000)
  }, [])
  return (
    <div style={{ border: '1px solid black', flex: 3, minHeight: '200px' }}>
      <h4>Messages</h4>
      <div>
        {
          messages.map((message) => {
            return (
              <div key={message.id} style={{ display: 'flex', padding: '10px' }}>
                <span style={{ color: '#7f7f7f', width: '100px', textAlign: 'end' }}>
                  {message.username}:
                </span>
                <span style={{ marginLeft: '25px' }}>
                  {message.message}
                </span>
              </div>
            )
          })
        }
      </div>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          onClick={() => {
            fetch(
              'http://localhost:3001/messages',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId, message, roomId: 1 })
              }
            )
              .then<{ success: boolean }>((res) => res.json())
              .then((res) => {
                if (res.success) {
                  setMessage('')
                }
              })
          }}
        >send</button>
      </div>
    </div>
  )
}

export default Messages