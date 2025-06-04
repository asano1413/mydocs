import { useRouter } from 'next/router'
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

export default function SearchResultPage() {
     const router = useRouter()
     const { q } = router.query
     const [results, setResults] = useState<any[]>([])
     const [loading, setLoading] = useState(true)

     useEffect(() => {
          const checkAuth = async () => {
               const { data } = await supabase.auth.getSession()
               if (!data.session) {
                    router.push('/login')
               }
          }
          checkAuth()
          if (!q || typeof q !== 'string') return

          const fetchResults = async () => {
               setLoading(true)
               const { data: user } = await supabase.auth.getUser()
               const userId = user?.user?.id

               const { data, error } = await supabase
                    .from('memos')
                    .select(`
          *,
          memo_tags (
            tags (
              name
            )
          )
        `)
                    .eq('user_id', userId)
                    .or(`
          title.ilike.%${q}%,
          usage.ilike.%${q}%,
          example.ilike.%${q}%,
          application.ilike.%${q}%
        `)

               if (error) console.error('検索失敗:', error)
               setResults(data || [])
               setLoading(false)
          }

          fetchResults()
     }, [q])

     return (
          <div className="max-w-6xl mx-auto px-4 py-10">
               <Header />
               <h2 className="text-2xl font-bold mb-6">
                    「{q}」の検索結果（{results.length}件）
               </h2>

               {loading ? (
                    <p className="text-gray-500">読み込み中...</p>
               ) : results.length === 0 ? (
                    <p className="text-gray-500">該当するメモはありません。</p>
               ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {results.map((memo) => (
                              <div
                                   key={memo.id}
                                   className="border rounded-xl p-4 bg-white shadow hover:shadow-md transition-all"
                              >
                                   <h3 className="font-semibold text-lg hover:underline">
                                        {memo.title}
                                   </h3>
                                   <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                                        {memo.usage || memo.example || memo.application || '内容なし'}
                                   </p>

                                   <div className="flex flex-wrap gap-2 mt-3">
                                        {(memo.memo_tags || []).map((mt: { tags: { name: boolean | Key | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined } }) => (
                                             <span
                                                  key={String(mt.tags.name ?? '')}
                                                  className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
                                             >
                                                  #{mt.tags.name}
                                             </span>
                                        ))}
                                   </div>

                                   <div className="mt-4 text-sm text-right">
                                        <Link
                                             href={`/items/${memo.category_id}`}
                                             className="text-blue-500 hover:underline"
                                        >
                                             → カテゴリへ移動
                                        </Link>
                                   </div>
                              </div>
                         ))}
                    </div>
               )}
          </div>
     )
}
