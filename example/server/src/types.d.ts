export interface UserType {
  id: number
  username: string
}

export interface MessageType {
  id: number
  message: string
  roomId: number
  userId: number
}

export interface RoomType {
  id: number
  name: string
  userIds: number[]
}

export type AllowedEvent<Id extends number = number> = 'rooms' | `rooms/${Id}/users` | `rooms/${Id}/messages`;
type AllowedRoomsPath = 'init' | 'new';
type AllowedRoomsUsersPath = 'init' | 'join' | 'leave';
type AllowedRoomsMessagesPath = 'init' | 'new';

export interface Sub<Event extends AllowedEvent<number>> {
  event: Event
  path: Event extends 'rooms' ? AllowedRoomsPath : Event extends `rooms/${number}/users` ? AllowedRoomsUsersPath : AllowedRoomsMessagesPath
}
