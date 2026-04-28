import { createClient } from '@/lib/supabase/client'

export type Citation = {
  id: string
  act_title: string
  year: string
  section: string
  status: string
  text: string
}

export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  created_at: string
}
export type Conversation = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// ─── Conversations ───────────────────────────────────────

export async function createConversation(userId: string, title = 'New Conversation'): Promise<Conversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single()
  if (error) { console.error('createConversation:', error); return null }
  return data
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) { console.error('getConversations:', error); return [] }
  return data ?? []
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('conversations')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function deleteConversation(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('conversations').delete().eq('id', id)
}

// ─── Messages ────────────────────────────────────────────

export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<Message | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single()
  if (error) { console.error('saveMessage:', error); return null }
  return data
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  if (error) { console.error('getMessages:', error); return [] }
  return data ?? []
}
