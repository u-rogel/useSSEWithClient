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

export type AllowedEvent = 'rooms' | 'rooms/users' | 'rooms/messages';
type AllowedRoomsPath = 'init' | 'new';
type AllowedRoomsUsersPath = 'init' | 'join' | 'leave';
type AllowedRoomsMessagesPath = 'init' | 'new';

export interface Sub<Event extends AllowedEvent> {
  id?: number
  event: Event
  path: Event extends 'rooms' ? AllowedRoomsPath : Event extends 'rooms/users' ? AllowedRoomsUsersPath : AllowedRoomsMessagesPath
}
