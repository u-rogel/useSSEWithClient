export interface User {
  id: number
  username: string
  roomsId: number[]
}

export interface Message {
  id: number
  message: string
  roomId: number
  userId: number
}

export interface Room {
  id: number
  name: string
}
