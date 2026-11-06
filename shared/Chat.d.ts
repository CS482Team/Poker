// This file contains the type definitions for the Chat module in the shared directory.
export interface ChatMessage {
    id: string;
    tableId: string;
    userId: string | null; // Nullable userId to accommodate system messages
    name: string;
    body: string:
    createdAt: string; // ISO 8601 formatted date string
}

export interface ChatSend {
    tableId: string
    userId: string
    body: string
}

export type ChatReply = { ok: true } | { ok: false; error: string };

export interface SupportRequest {
    userId: string
    body: string
    tableId?: string
}

