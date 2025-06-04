import { supabase } from '@/lib/supabase'

export const fetchUserTags = async () => {
  const { data: userData } = await supabase.auth.getUser()
  const userId = userData?.user?.id
  if (!userId) throw new Error('未ログインまたはユーザーID取得失敗')

  const { data, error } = await supabase
    .from('tags')
    .select('*, memo_tags(memo_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
