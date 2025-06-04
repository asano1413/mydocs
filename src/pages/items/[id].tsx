import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import Header from '@/components/Header'
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

export default function ItemPage() {
     const router = useRouter()
     const { id } = router.query

     const [categoryName, setCategoryName] = useState('')
     const [memos, setMemos] = useState<any[]>([])
     const [loading, setLoading] = useState(true)
     const [newMemo, setNewMemo] = useState({
          title: '',
          usage: '',
          example: '',
          application: '',
          reference_url: '',
     })
     const [isSubmitting, setIsSubmitting] = useState(false)
     const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
     const [editMemo, setEditMemo] = useState({
          title: '',
          usage: '',
          example: '',
          application: '',
          reference_url: '',
     })
     const [sortKey, setSortKey] = useState<'created_at' | 'title'>('created_at')
     const [sortAsc, setSortAsc] = useState(false)
     const [newTags, setNewTags] = useState('')
     const [activeTag, setActiveTag] = useState<string | null>(null)
     const filteredMemos = activeTag
          ? memos.filter((m) =>
               m.memo_tags?.some((mt: any) => mt.tags.name === activeTag)
          )
          : memos
     const [isEditModalOpen, setIsEditModalOpen] = useState(false)
     const [editTargetMemo, setEditTargetMemo] = useState<any | null>(null)
     const [searchQuery, setSearchQuery] = useState('')

     const markdownRenderers = {
          code({ node, inline, className, children, ...props }: any) {
               const match = /language-(\w+)/.exec(className || '')
               return !inline && match ? (
                    <SyntaxHighlighter
                         style={materialLight}
                         language={match[1]}
                         PreTag="div"
                         {...props}
                    >
                         {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
               ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">
                         {children}
                    </code>
               )
          },
     }

     const startEdit = (memo: any) => {
          setEditingMemoId(memo.id)
          setEditMemo({
               title: memo.title,
               usage: memo.usage,
               example: memo.example,
               application: memo.application,
               reference_url: memo.reference_url || '',
          })
     }

     const handleUpdateMemo = async () => {
          if (!editingMemoId) return

          const { error, data } = await supabase
               .from('memos')
               .update(editMemo)
               .eq('id', editingMemoId)
               .select()

          if (error) {
               alert('更新に失敗しました')
               return
          }

          setMemos((prev) =>
               prev.map((m) => (m.id === editingMemoId ? data[0] : m))
          )
          setEditingMemoId(null)
     }

     const handleDeleteMemo = async (id: string) => {
          const { error } = await supabase.from('memos').delete().eq('id', id)

          if (error) {
               alert('削除に失敗しました')
               return
          }

          setMemos((prev) => prev.filter((m) => m.id !== id))
     }

     const handleAddMemo = async () => {
          if (!newMemo.title.trim()) return alert('タイトルは必須です')
          setIsSubmitting(true)

          const { data: memoData, error: memoError } = await supabase
               .from('memos')
               .insert([{ category_id: id, ...newMemo }])
               .select()

          if (memoError || !memoData || !memoData[0]) {
               alert('メモ追加に失敗しました')
               setIsSubmitting(false)
               return
          }

          const memoId = memoData[0].id

          const tagNames = newTags.split(',').map((t) => t.trim()).filter(Boolean)

          const { data: user } = await supabase.auth.getUser()
          const userId = user?.user?.id

          for (const name of tagNames) {
               let { data: existingTag } = await supabase
                    .from('tags')
                    .select('*')
                    .eq('name', name)
                    .eq('user_id', userId)
                    .maybeSingle()

               if (!existingTag) {
                    const { data: newTag } = await supabase
                         .from('tags')
                         .insert([{ name, user_id: userId }])
                         .select()
                    existingTag = newTag?.[0]
               }

               if (existingTag) {
                    await supabase.from('memo_tags').insert([
                         { memo_id: memoId, tag_id: existingTag.id },
                    ])
               }
          }

          setNewMemo({ title: '', usage: '', example: '', application: '', reference_url: '' })
          setNewTags('')
          setMemos((prev) => [memoData[0], ...prev])
          setIsSubmitting(false)
     }


     const sortedMemos = [...memos].sort((a, b) => {
          const aVal = a[sortKey]
          const bVal = b[sortKey]

          if (typeof aVal === 'string' && typeof bVal === 'string') {
               return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
          }

          if (aVal instanceof Date || bVal instanceof Date) {
               return sortAsc
                    ? new Date(aVal).getTime() - new Date(bVal).getTime()
                    : new Date(bVal).getTime() - new Date(aVal).getTime()
          }

          return 0
     })

     const searchedMemos = sortedMemos.filter((memo) => {
          const q = searchQuery.toLowerCase()
          return (
               memo.title?.toLowerCase().includes(q) ||
               memo.usage?.toLowerCase().includes(q) ||
               memo.example?.toLowerCase().includes(q) ||
               memo.application?.toLowerCase().includes(q) ||
               memo.memo_tags?.some((mt: any) => mt.tags.name.toLowerCase().includes(q))
          )
     })

     useEffect(() => {
          if (!id) return

          const checkAuth = async () => {
               const { data } = await supabase.auth.getSession()
               if (!data.session) {
                    router.push('/login')
               }
          }
          checkAuth()

          const fetchData = async () => {
               setLoading(true)
               const { data: category } = await supabase
                    .from('categories')
                    .select('name')
                    .eq('id', id)
                    .single()

               const { data: memos } = await supabase
                    .from('memos')
                    .select(`
                    *,
                    memo_tags (
                         tag_id,
                         tags (
                         id,
                         name
                         )
                    )
                    `)
                    .eq('category_id', id)
                    .order('created_at', { ascending: false })


               setCategoryName(category?.name || '')
               setMemos(memos || [])
               setLoading(false)
          }

          fetchData()
     }, [id])

     return (
          <div className="max-w-4xl mx-auto py-10 px-4">
               <Header />
               <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-6">{categoryName} のメモ一覧</h1>
                    <div className="flex items-center gap-3 mb-6">
                         <label className="text-sm">並び替え:</label>
                         <select
                              className="border p-1 rounded"
                              value={sortKey}
                              onChange={(e) => setSortKey(e.target.value as 'created_at' | 'title')}
                         >
                              <option value="created_at">作成日</option>
                              <option value="title">タイトル</option>
                         </select>
                         <button
                              className="text-sm text-blue-600 underline"
                              onClick={() => setSortAsc((prev) => !prev)}
                         >
                              {sortAsc ? '昇順' : '降順'}
                         </button>
                    </div>

                    <div className="mb-8 p-4 border rounded shadow-sm bg-white">
                         <h2 className="text-xl font-bold mb-4">新規メモの追加</h2>
                         <input
                              type="text"
                              placeholder="タイトル（用語）"
                              className="w-full p-2 mb-3 border rounded"
                              value={newMemo.title}
                              onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                         />
                         <label className="font-semibold">使い方</label>
                         <MDEditor
                              value={newMemo.usage}
                              onChange={(val = '') => setNewMemo({ ...newMemo, usage: val })}
                              className="mb-3"
                         />
                         <label className="font-semibold">使用例</label>
                         <MDEditor
                              value={newMemo.example}
                              onChange={(val = '') => setNewMemo({ ...newMemo, example: val })}
                              className="mb-3"
                         />
                         <label className="font-semibold">応用例</label>
                         <MDEditor
                              value={newMemo.application}
                              onChange={(val = '') => setNewMemo({ ...newMemo, application: val })}
                              className="mb-3"
                         />
                         <input
                              type="url"
                              placeholder="参考URL（任意）"
                              className="w-full p-2 mb-3 border rounded"
                              value={newMemo.reference_url}
                              onChange={(e) => setNewMemo({ ...newMemo, reference_url: e.target.value })}
                         />
                         <button
                              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                              onClick={handleAddMemo}
                              disabled={isSubmitting}
                         >
                              追加
                         </button>
                    </div>

                    {loading ? (
                         <p className="text-gray-600">読み込み中...</p>
                    ) : (
                         <div className="space-y-4">
                              {filteredMemos.length === 0 ? (
                                   <p className="text-gray-500">このカテゴリにはまだメモがありません。</p>
                              ) : (
                                   filteredMemos.map((memo) => (
                                        <details key={memo.id} className="border rounded p-4 shadow-sm">
                                             <summary className="font-semibold cursor-pointer text-lg">
                                                  {memo.title}
                                             </summary>
                                             <div className="mt-3 space-y-3 text-sm text-gray-800">
                                                  {editingMemoId === memo.id ? (
                                                       <div className="space-y-3">
                                                            <input
                                                                 type="text"
                                                                 className="w-full border p-2 rounded"
                                                                 value={editMemo.title}
                                                                 onChange={(e) =>
                                                                      setEditMemo({ ...editMemo, title: e.target.value })
                                                                 }
                                                            />
                                                            <label>使い方</label>
                                                            <MDEditor
                                                                 value={editMemo.usage}
                                                                 onChange={(val = '') =>
                                                                      setEditMemo({ ...editMemo, usage: val })
                                                                 }
                                                            />
                                                            <label>使用例</label>
                                                            <MDEditor
                                                                 value={editMemo.example}
                                                                 onChange={(val = '') =>
                                                                      setEditMemo({ ...editMemo, example: val })
                                                                 }
                                                            />
                                                            <label>応用例</label>
                                                            <MDEditor
                                                                 value={editMemo.application}
                                                                 onChange={(val = '') =>
                                                                      setEditMemo({ ...editMemo, application: val })
                                                                 }
                                                            />
                                                            <input
                                                                 type="url"
                                                                 className="w-full border p-2 rounded"
                                                                 placeholder="参考URL"
                                                                 value={editMemo.reference_url}
                                                                 onChange={(e) =>
                                                                      setEditMemo({
                                                                           ...editMemo,
                                                                           reference_url: e.target.value,
                                                                      })
                                                                 }
                                                            />
                                                            <div className="flex gap-3 mt-2">
                                                                 <button
                                                                      onClick={handleUpdateMemo}
                                                                      className="px-4 py-1 bg-blue-600 text-white rounded"
                                                                 >
                                                                      保存
                                                                 </button>
                                                                 <button
                                                                      onClick={() => setEditingMemoId(null)}
                                                                      className="px-4 py-1 bg-gray-300 rounded"
                                                                 >
                                                                      キャンセル
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  ) : (
                                                       <>
                                                            <div>
                                                                 <strong>使い方:</strong>
                                                                 <ReactMarkdown components={markdownRenderers}>
                                                                      {memo.usage}
                                                                 </ReactMarkdown>
                                                            </div>
                                                            <div>
                                                                 <strong>使用例:</strong>
                                                                 <ReactMarkdown components={markdownRenderers}>
                                                                      {memo.example}
                                                                 </ReactMarkdown>
                                                            </div>
                                                            <div>
                                                                 <strong>応用例:</strong>
                                                                 <ReactMarkdown components={markdownRenderers}>
                                                                      {memo.application}
                                                                 </ReactMarkdown>
                                                            </div>
                                                            {memo.reference_url && (
                                                                 <p>
                                                                      <strong>参考URL:</strong>{' '}
                                                                      <a
                                                                           href={memo.reference_url}
                                                                           target="_blank"
                                                                           rel="noopener noreferrer"
                                                                           className="text-blue-600 underline"
                                                                      >
                                                                           {memo.reference_url}
                                                                      </a>
                                                                 </p>
                                                            )}
                                                            {memo.memo_tags?.map((mt: any) => (
                                                                 <span
                                                                      key={mt.tag_id}
                                                                      onClick={() => setActiveTag(mt.tags.name)}
                                                                      className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-2 cursor-pointer"
                                                                 >
                                                                      #{mt.tags.name}
                                                                 </span>
                                                            ))}

                                                            <div className="mt-2 flex gap-3">
                                                                 <div className="mt-2 flex gap-3">
                                                                      <button
                                                                           onClick={() => {
                                                                                setEditTargetMemo(memo)
                                                                                setEditMemo({ ...memo })
                                                                                setIsEditModalOpen(true)
                                                                           }}
                                                                           className="text-blue-600 underline text-sm"
                                                                      >
                                                                           編集
                                                                      </button>
                                                                      <button
                                                                           onClick={() => handleDeleteMemo(memo.id)}
                                                                           className="text-red-600 underline text-sm"
                                                                      >
                                                                           削除
                                                                      </button>
                                                                 </div>
                                                            </div>
                                                       </>
                                                  )}
                                             </div>
                                        </details>
                                   ))
                              )}
                         </div>
                    )}
                    {isEditModalOpen && editTargetMemo && (
                         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                              <div className="bg-white w-full max-w-xl p-6 rounded shadow-lg space-y-4">
                                   <h2 className="text-xl font-bold">メモの編集</h2>
                                   <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={editMemo.title}
                                        onChange={(e) => setEditMemo({ ...editMemo, title: e.target.value })}
                                   />
                                   <label>使い方</label>
                                   <MDEditor
                                        value={editMemo.usage}
                                        onChange={(val = '') => setEditMemo({ ...editMemo, usage: val })}
                                   />
                                   <div className="flex justify-end gap-3 mt-4">
                                        <button
                                             onClick={() => setIsEditModalOpen(false)}
                                             className="px-4 py-1 bg-gray-200 rounded"
                                        >
                                             キャンセル
                                        </button>
                                        <button
                                             onClick={async () => {
                                                  const { error, data } = await supabase
                                                       .from('memos')
                                                       .update(editMemo)
                                                       .eq('id', editTargetMemo.id)
                                                       .select()
                                                  if (error) {
                                                       toast.error('更新に失敗しました')
                                                  } else {
                                                       setMemos((prev) =>
                                                            prev.map((m) => (m.id === editTargetMemo.id ? data[0] : m))
                                                       )
                                                       toast.success('編集が完了しました')
                                                       setIsEditModalOpen(false)
                                                  }
                                             }}
                                             className="px-4 py-1 bg-blue-600 text-white rounded"
                                        >
                                             保存
                                        </button>
                                   </div>
                              </div>
                         </div>
                    )}

               </div>
          </div>
     )
}
