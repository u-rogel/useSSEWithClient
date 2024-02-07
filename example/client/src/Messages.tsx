import React, { useEffect, useState } from 'react'
import { Message, Room, User } from './types'

type ChatMessage = Message & Pick<User, 'username'>

interface MessagesProps {
  userId: User['id']
  roomId: Room['id']
}

const Messages: React.FC<MessagesProps> = ({ userId, roomId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch(`http://localhost:3001/messages?roomId=${roomId}`)
        .then<ChatMessage[]>((res) => res.json())
        .then((res) => {
          setMessages(res)
        })
    }, 3000)
    return () => {
      setMessages([])
      clearInterval(intervalId)
    }
  }, [roomId])
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
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
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
                body: JSON.stringify({ userId, message: newMessage, roomId })
              }
            )
              .then<{ success: boolean }>((res) => res.json())
              .then((res) => {
                if (res.success) {
                  setNewMessage('')
                }
              })
          }}
        >send</button>
      </div>
    </div>
  )
}

export default Messages