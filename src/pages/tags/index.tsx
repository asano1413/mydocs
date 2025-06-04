import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import { fetchUserTags } from '@/lib/tags'
import Header from '@/components/Header'

export default function TagsPage() {
     const [tags, setTags] = useState<any[]>([])
     const [loading, setLoading] = useState(true)
     const router = useRouter()
     const [error, setError] = useState<string | null>(null)

     useEffect(() => {
          const checkAuth = async () => {
               const { data } = await supabase.auth.getSession()
               if (!data.session) {
                    router.push('/login')
               }
          }
          checkAuth()

          const fetchTags = async () => {
               const { data: user } = await supabase.auth.getUser()
               const userId = user?.user?.id

               const { data, error } = await supabase
                    .from('tags')
                    .select('*, memo_tags(memo_id)')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })

               if (error) {
                    console.error('タグ取得エラー', error)
                    return
               }

               setTags(data || [])
               setLoading(false)
          }

          const loadTags = async () => {
               try {
                    const data = await fetchUserTags()
                    setTags(data)
               } catch (err: any) {
                    setError(err.message)
               }
          }

          loadTags()

          fetchTags()
     }, [])

     const handleDelete = async (tagId: string) => {
          const tag = tags.find((t) => t.id === tagId)
          if (tag.memo_tags.length > 0) {
               alert('このタグは使用中のため削除できません')
               return
          }

          const { error } = await supabase.from('tags').delete().eq('id', tagId)
          if (error) {
               alert('削除に失敗しました')
          } else {
               setTags((prev) => prev.filter((t) => t.id !== tagId))
          }
     }

     return (
          <div className="max-w-3xl mx-auto py-10 px-4">
               <Header />
               <h1 className="text-2xl font-bold mb-6">タグ一覧</h1>

               {loading ? (
                    <p>読み込み中...</p>
               ) : (
                    <div className="space-y-3">
                         {tags.length === 0 ? (
                              <p className="text-gray-500">まだタグは登録されていません。</p>
                         ) : (
                              tags.map((tag) => (
                                   <div
                                        key={tag.id}
                                        className="border px-4 py-2 rounded flex justify-between items-center"
                                   >
                                        <div>
                                             <span className="font-semibold">#{tag.name}</span>
                                             <span className="text-sm text-gray-500 ml-2">
                                                  使用中: {tag.memo_tags.length}件
                                             </span>
                                        </div>
                                        <button
                                             onClick={() => handleDelete(tag.id)}
                                             className="text-red-600 hover:underline text-sm"
                                        >
                                             削除
                                        </button>
                                   </div>
                              ))
                         )}
                    </div>
               )}
          </div>
     )
}
