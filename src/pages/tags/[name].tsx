import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'
import Head from 'next/head'

export default function TagMemoList() {
     const router = useRouter()
     const { name } = router.query

     const [memos, setMemos] = useState<any[]>([])
     const [tag, setTag] = useState<any>(null)
     const [loading, setLoading] = useState(true)

     useEffect(() => {
          if (!name) return

          const checkAuth = async () => {
               const { data } = await supabase.auth.getSession()
               if (!data.session) {
                    router.push('/login')
               }
          }
          checkAuth()

          const fetchTaggedMemos = async () => {
               setLoading(true)

               const { data: user } = await supabase.auth.getUser()
               const userId = user?.user?.id

               const { data: tagData, error: tagError } = await supabase
                    .from('tags')
                    .select('id, name')
                    .eq('name', name)
                    .eq('user_id', userId)
                    .maybeSingle()

               if (!tagData || tagError) {
                    setTag(null)
                    setMemos([])
                    setLoading(false)
                    return
               }

               setTag(tagData)

               const { data: memoData, error: memoError } = await supabase
                    .from('memo_tags')
                    .select('memos (*)')
                    .eq('tag_id', tagData.id)

               const extracted = memoData?.map((m: any) => m.memos) || []
               setMemos(extracted)
               setLoading(false)
          }

          fetchTaggedMemos()
     }, [name])

     return (
          <>
               <Head>
                    <title>ログイン - project_name</title>
                    <link rel="icon" href="/favicon.svg" />
               </Head>
               <div className="max-w-4xl mx-auto px-4 py-10">
                    <Header />
                    <h1 className="text-2xl font-bold mb-6">
                         タグ: <span className="text-blue-600">#{name}</span> のメモ一覧
                    </h1>

                    {loading ? (
                         <p className="text-gray-600">読み込み中...</p>
                    ) : memos.length === 0 ? (
                         <p className="text-gray-500">このタグに関連するメモはありません。</p>
                    ) : (
                         <div className="space-y-4">
                              {memos.map((memo) => (
                                   <div
                                        key={memo.id}
                                        className="border rounded p-4 bg-white shadow-sm hover:shadow transition"
                                   >
                                        <h2 className="text-lg font-bold">{memo.title}</h2>
                                        <p className="text-sm text-gray-600 mt-1 truncate">{memo.usage?.slice(0, 80)}...</p>
                                        <Link
                                             href={`/items/${memo.category_id}`}
                                             className="text-blue-500 text-sm mt-2 inline-block"
                                        >
                                             カテゴリへ移動 →
                                        </Link>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>
          </>
     )
}
