export type AppScreen = 'home' | 'join' | 'waiting' | 'transfer';

export interface RoomState {
  code: string;
  role: 'host' | 'peer' | null;
  connectedUsers: number;
  peerConnected: boolean;
}

export type WSMessageType =
  | 'create_room'
  | 'room_created'
  | 'join_room'
  | 'room_ready'
  | 'close_room'
  | 'room_closed'
  | 'error'
  | 'signal'
  | 'file_meta'
  | 'file_chunk'
  | 'file_complete'
  | 'text_message'
  | 'ping'
  | 'pong';

export interface WSMessage {
  type: WSMessageType;
  code?: string;
  message?: string;
  reason?: string;
  payload?: any;
  role?: 'host' | 'peer';
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
  senderRole: 'host' | 'peer';
  timestamp: number;
}

export interface FileTransferItem {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number; // 0 to 100
  bytesTransferred: number;
  speed: number; // bytes per sec
  status: 'pending' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  isIncoming: boolean;
  blobUrl?: string;
  blob?: Blob;
  previewUrl?: string;
  senderRole: 'host' | 'peer';
  timestamp: number;
}

export interface SharedTextItem {
  id: string;
  text: string;
  senderRole: 'host' | 'peer';
  timestamp: number;
}
