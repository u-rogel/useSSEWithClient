import React, { useCallback, useEffect, useState } from 'react'
import { Message, Room, User } from './types'
import useStateRef from 'react-usestateref'

type ChatMessage = Message & Pick<User, 'username'>

interface MessagesProps {
  roomId: Room['id']
  sse: EventSource
}

const Messages: React.FC<MessagesProps> = ({ roomId, sse }) => {
  const [messages, setMessages, messagesRef] = useStateRef<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  const newData = useCallback((data: MessageEvent<string>) => {
    console.log({ data });
    const res: { type: 'INIT' | 'ADD', data: ChatMessage[] } = JSON.parse(data.data);
    console.log({ res });

    if (res.type === 'INIT') {
      setMessages(res.data)
    } else if (res.type === 'ADD') {
      setMessages([...messagesRef.current, ...res.data])
    }
  }, [roomId])

  useEffect(() => {
    sse.addEventListener('rooms/messages', newData);
    fetch(
      `http://localhost:3001/rooms/messages/get?roomId=${roomId}`,
      {
        headers: {
          'User-Id': localStorage.getItem('userId')!
        }
      }
    )
      .then((res) => res.json())

    return () => {
      setMessages([])
      sse.removeEventListener('rooms/messages', newData)
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
              'http://localhost:3001/rooms/messages/new',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'User-Id': localStorage.getItem('userId')!
                },
                body: JSON.stringify({ message: newMessage, roomId })
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