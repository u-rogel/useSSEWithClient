import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css' 
import useSSE from 'use-sse'

type SSEClient = {
  status: 'none' | 'connecting' | 'connected' | 'disconnecting'
  sseChannel: null | EventSource
}

function App() {
  useSSE();
  const [client, setClient] = useState<SSEClient>({
     status: 'none',
     sseChannel: null
  })

  useEffect(() => {
    fetch('http://localhost:3000')
      .then((res) => res.text())
      .then((res) => {
        console.log({ res });
        
      })
  }, [])

  useEffect(() => {
    if (client.status === 'connecting') {
      const evtSource = new EventSource("http://localhost:3000/sse-register");
      setClient({ status: 'connected', sseChannel: evtSource });
      evtSource.onmessage = (msg) => {
        console.log({ msg});
      }
    } else if (client.status === 'disconnecting' && client.sseChannel != null) {
      client.sseChannel.close()
    }
  }, [client.status])

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        {
          client.status !== 'connected'
            ? (
              <button
              onClick={() => {
                setClient({ ...client, status: 'connecting'})
              }}
              >
                connect
              </button>
            )
            : (
              <button
              onClick={() => {
                setClient({ ...client, status: 'disconnecting'})
              }}
              >disconnect</button>
            )
        }
      </div>
    </>
  )
}

export default App
