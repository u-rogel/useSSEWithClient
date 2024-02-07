export interface User {
  id: number
  username: string
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
  userIds: number[]
}
