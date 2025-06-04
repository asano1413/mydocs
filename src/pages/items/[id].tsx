"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import dynamic from "next/dynamic"
import toast, { Toaster } from "react-hot-toast"
import Header from "@/components/Header"
import { PlusCircle, Search, Tag, Calendar, SortAsc, SortDesc, Edit2, Trash2, ExternalLink, X } from "lucide-react"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

export default function ItemPage() {
     const router = useRouter()
     const { id } = router.query

     const [categoryName, setCategoryName] = useState("")
     const [memos, setMemos] = useState<any[]>([])
     const [loading, setLoading] = useState(true)
     const [newMemo, setNewMemo] = useState({
          title: "",
          usage: "",
          example: "",
          application: "",
          reference_url: "",
     })
     const [isSubmitting, setIsSubmitting] = useState(false)
     const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
     const [editMemo, setEditMemo] = useState({
          title: "",
          usage: "",
          example: "",
          application: "",
          reference_url: "",
     })
     const [sortKey, setSortKey] = useState<"created_at" | "title">("created_at")
     const [sortAsc, setSortAsc] = useState(false)
     const [newTags, setNewTags] = useState("")
     const [activeTag, setActiveTag] = useState<string | null>(null)
     const [isEditModalOpen, setIsEditModalOpen] = useState(false)
     const [editTargetMemo, setEditTargetMemo] = useState<any | null>(null)
     const [searchQuery, setSearchQuery] = useState("")
     const [isAddingMemo, setIsAddingMemo] = useState(false)

     const filteredMemos = activeTag
          ? memos.filter((m) => m.memo_tags?.some((mt: any) => mt.tags.name === activeTag))
          : memos

     const markdownRenderers = {
          code({ node, inline, className, children, ...props }: any) {
               const match = /language-(\w+)/.exec(className || "")
               return !inline && match ? (
                    <SyntaxHighlighter style={materialLight} language={match[1]} PreTag="div" {...props}>
                         {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
               ) : (
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">{children}</code>
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
               reference_url: memo.reference_url || "",
          })
     }

     const handleUpdateMemo = async () => {
          if (!editingMemoId) return

          const { error, data } = await supabase.from("memos").update(editMemo).eq("id", editingMemoId).select()

          if (error) {
               toast.error("更新に失敗しました")
               return
          }

          setMemos((prev) => prev.map((m) => (m.id === editingMemoId ? data[0] : m)))
          setEditingMemoId(null)
          toast.success("メモを更新しました")
     }

     const handleDeleteMemo = async (id: string) => {
          if (!confirm("このメモを削除してもよろしいですか？")) return

          const { error } = await supabase.from("memos").delete().eq("id", id)

          if (error) {
               toast.error("削除に失敗しました")
               return
          }

          setMemos((prev) => prev.filter((m) => m.id !== id))
          toast.success("メモを削除しました")
     }

     const handleAddMemo = async () => {
          if (!newMemo.title.trim()) {
               toast.error("タイトルは必須です")
               return
          }

          setIsSubmitting(true)

          const { data: memoData, error: memoError } = await supabase
               .from("memos")
               .insert([{ category_id: id, ...newMemo }])
               .select()

          if (memoError || !memoData || !memoData[0]) {
               toast.error("メモ追加に失敗しました")
               setIsSubmitting(false)
               return
          }

          const memoId = memoData[0].id

          const tagNames = newTags
               .split(",")
               .map((t) => t.trim())
               .filter(Boolean)

          const { data: user } = await supabase.auth.getUser()
          const userId = user?.user?.id

          for (const name of tagNames) {
               let { data: existingTag } = await supabase
                    .from("tags")
                    .select("*")
                    .eq("name", name)
                    .eq("user_id", userId)
                    .maybeSingle()

               if (!existingTag) {
                    const { data: newTag } = await supabase
                         .from("tags")
                         .insert([{ name, user_id: userId }])
                         .select()
                    existingTag = newTag?.[0]
               }

               if (existingTag) {
                    await supabase.from("memo_tags").insert([{ memo_id: memoId, tag_id: existingTag.id }])
               }
          }

          setNewMemo({ title: "", usage: "", example: "", application: "", reference_url: "" })
          setNewTags("")
          setMemos((prev) => [memoData[0], ...prev])
          setIsSubmitting(false)
          setIsAddingMemo(false)
          toast.success("メモを追加しました")
     }

     const sortedMemos = [...filteredMemos].sort((a, b) => {
          const aVal = a[sortKey]
          const bVal = b[sortKey]

          if (typeof aVal === "string" && typeof bVal === "string") {
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
                    router.push("/login")
               }
          }
          checkAuth()

          const fetchData = async () => {
               setLoading(true)
               const { data: category } = await supabase.from("categories").select("name").eq("id", id).single()

               const { data: memos } = await supabase
                    .from("memos")
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
                    .eq("category_id", id)
                    .order("created_at", { ascending: false })

               setCategoryName(category?.name || "")
               setMemos(memos || [])
               setLoading(false)
          }

          fetchData()
     }, [id, router])

     // タグの集計
     const allTags = memos
          .flatMap((memo) => memo.memo_tags?.map((mt: any) => mt.tags.name) || [])
          .reduce((acc: Record<string, number>, tag: string) => {
               acc[tag] = (acc[tag] || 0) + 1
               return acc
          }, {})

     return (
          <div className="min-h-screen bg-gray-50">
               <Toaster position="top-right" />
               <Header />

               <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
                              <p className="text-gray-500 mt-1">メモ一覧 ({searchedMemos.length}件)</p>
                         </div>

                         <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
                              {activeTag && (
                                   <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                        <Tag size={14} className="mr-1" />
                                        {activeTag}
                                        <button onClick={() => setActiveTag(null)} className="ml-1 hover:text-blue-900">
                                             <X size={14} />
                                        </button>
                                   </div>
                              )}
                              <button
                                   onClick={() => setIsAddingMemo(true)}
                                   className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                              >
                                   <PlusCircle size={16} className="mr-2" />
                                   新規メモ
                              </button>
                         </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
                         <div className="p-4 border-b border-gray-200">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                   <div className="relative flex-grow">
                                        <input
                                             type="text"
                                             placeholder="メモを検索..."
                                             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                             value={searchQuery}
                                             onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                   </div>

                                   <div className="flex items-center gap-2">
                                        <select
                                             className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                             value={sortKey}
                                             onChange={(e) => setSortKey(e.target.value as "created_at" | "title")}
                                        >
                                             <option value="created_at">作成日</option>
                                             <option value="title">タイトル</option>
                                        </select>
                                        <button
                                             className="inline-flex items-center border border-gray-300 rounded-md px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                                             onClick={() => setSortAsc((prev) => !prev)}
                                        >
                                             {sortAsc ? (
                                                  <SortAsc size={18} className="text-gray-600" />
                                             ) : (
                                                  <SortDesc size={18} className="text-gray-600" />
                                             )}
                                        </button>
                                   </div>
                              </div>
                         </div>

                         {Object.keys(allTags).length > 0 && (
                              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                                   <div className="flex flex-wrap gap-2">
                                        {Object.entries(allTags).map(([tag, count]) => (
                                             <button
                                                  key={tag}
                                                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeTag === tag ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                                       }`}
                                             >
                                                  #{tag} <span className="ml-1 opacity-70">({String(count)})</span>
                                             </button>
                                        ))}
                                   </div>
                              </div>
                         )}
                    </div>

                    {isAddingMemo && (
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8 overflow-hidden">
                              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                                   <h2 className="text-lg font-semibold text-gray-900">新規メモの追加</h2>
                                   <button onClick={() => setIsAddingMemo(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                   </button>
                              </div>

                              <div className="p-6 space-y-5">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">タイトル（用語）</label>
                                        <input
                                             type="text"
                                             placeholder="タイトルを入力"
                                             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                             value={newMemo.title}
                                             onChange={(e) => setNewMemo({ ...newMemo, title: e.target.value })}
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">使い方</label>
                                        <MDEditor
                                             value={newMemo.usage}
                                             onChange={(val = "") => setNewMemo({ ...newMemo, usage: val })}
                                             preview="edit"
                                             className="border border-gray-300 rounded-md overflow-hidden"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">使用例</label>
                                        <MDEditor
                                             value={newMemo.example}
                                             onChange={(val = "") => setNewMemo({ ...newMemo, example: val })}
                                             preview="edit"
                                             className="border border-gray-300 rounded-md overflow-hidden"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">応用例</label>
                                        <MDEditor
                                             value={newMemo.application}
                                             onChange={(val = "") => setNewMemo({ ...newMemo, application: val })}
                                             preview="edit"
                                             className="border border-gray-300 rounded-md overflow-hidden"
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">参考URL（任意）</label>
                                        <input
                                             type="url"
                                             placeholder="https://..."
                                             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                             value={newMemo.reference_url}
                                             onChange={(e) => setNewMemo({ ...newMemo, reference_url: e.target.value })}
                                        />
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">タグ（カンマ区切り）</label>
                                        <input
                                             type="text"
                                             placeholder="タグ1, タグ2, タグ3"
                                             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                             value={newTags}
                                             onChange={(e) => setNewTags(e.target.value)}
                                        />
                                   </div>

                                   <div className="pt-2">
                                        <button
                                             className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                             onClick={handleAddMemo}
                                             disabled={isSubmitting}
                                        >
                                             {isSubmitting ? "追加中..." : "メモを追加"}
                                        </button>
                                   </div>
                              </div>
                         </div>
                    )}

                    {loading ? (
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                              <div className="animate-pulse flex flex-col items-center">
                                   <div className="h-12 w-12 rounded-full bg-gray-200 mb-4"></div>
                                   <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                                   <div className="h-3 w-24 bg-gray-200 rounded"></div>
                              </div>
                         </div>
                    ) : searchedMemos.length === 0 ? (
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                              <p className="text-gray-500">
                                   {searchQuery
                                        ? "キーワードに一致するメモが見つかりませんでした。"
                                        : "このカテゴリにはまだメモがありません。"}
                              </p>
                         </div>
                    ) : (
                         <div className="space-y-4">
                              {searchedMemos.map((memo) => (
                                   <div key={memo.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        <details className="group">
                                             <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                                                  <div className="flex items-center">
                                                       <h3 className="text-lg font-medium text-gray-900">{memo.title}</h3>
                                                       {memo.memo_tags?.length > 0 && (
                                                            <div className="ml-3 flex flex-wrap gap-1">
                                                                 {memo.memo_tags.map((mt: any) => (
                                                                      <span
                                                                           key={mt.tag_id}
                                                                           onClick={(e) => {
                                                                                e.preventDefault()
                                                                                setActiveTag(mt.tags.name)
                                                                           }}
                                                                           className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100"
                                                                      >
                                                                           #{mt.tags.name}
                                                                      </span>
                                                                 ))}
                                                            </div>
                                                       )}
                                                  </div>
                                                  <div className="flex items-center text-gray-500 text-sm">
                                                       <Calendar size={14} className="mr-1" />
                                                       {new Date(memo.created_at).toLocaleDateString()}
                                                       <div className="ml-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center group-open:rotate-180 transition-transform">
                                                            <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                       </div>
                                                  </div>
                                             </summary>

                                             <div className="p-4 pt-0 border-t border-gray-100">
                                                  {editingMemoId === memo.id ? (
                                                       <div className="space-y-4 pt-4">
                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                                                                 <input
                                                                      type="text"
                                                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                      value={editMemo.title}
                                                                      onChange={(e) => setEditMemo({ ...editMemo, title: e.target.value })}
                                                                 />
                                                            </div>

                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">使い方</label>
                                                                 <MDEditor
                                                                      value={editMemo.usage}
                                                                      onChange={(val = "") => setEditMemo({ ...editMemo, usage: val })}
                                                                      preview="edit"
                                                                      className="border border-gray-300 rounded-md overflow-hidden"
                                                                 />
                                                            </div>

                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">使用例</label>
                                                                 <MDEditor
                                                                      value={editMemo.example}
                                                                      onChange={(val = "") => setEditMemo({ ...editMemo, example: val })}
                                                                      preview="edit"
                                                                      className="border border-gray-300 rounded-md overflow-hidden"
                                                                 />
                                                            </div>

                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">応用例</label>
                                                                 <MDEditor
                                                                      value={editMemo.application}
                                                                      onChange={(val = "") => setEditMemo({ ...editMemo, application: val })}
                                                                      preview="edit"
                                                                      className="border border-gray-300 rounded-md overflow-hidden"
                                                                 />
                                                            </div>

                                                            <div>
                                                                 <label className="block text-sm font-medium text-gray-700 mb-1">参考URL</label>
                                                                 <input
                                                                      type="url"
                                                                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                                      placeholder="https://..."
                                                                      value={editMemo.reference_url}
                                                                      onChange={(e) => setEditMemo({ ...editMemo, reference_url: e.target.value })}
                                                                 />
                                                            </div>

                                                            <div className="flex gap-3 pt-2">
                                                                 <button
                                                                      onClick={handleUpdateMemo}
                                                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                                                 >
                                                                      保存
                                                                 </button>
                                                                 <button
                                                                      onClick={() => setEditingMemoId(null)}
                                                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                                                 >
                                                                      キャンセル
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  ) : (
                                                       <div className="space-y-6 pt-4">
                                                            <div className="prose prose-blue max-w-none">
                                                                 <h4 className="text-sm font-medium text-gray-500 mb-2">使い方</h4>
                                                                 <div className="bg-gray-50 p-4 rounded-md">
                                                                      <ReactMarkdown components={markdownRenderers}>{memo.usage || "内容なし"}</ReactMarkdown>
                                                                 </div>
                                                            </div>

                                                            <div className="prose prose-blue max-w-none">
                                                                 <h4 className="text-sm font-medium text-gray-500 mb-2">使用例</h4>
                                                                 <div className="bg-gray-50 p-4 rounded-md">
                                                                      <ReactMarkdown components={markdownRenderers}>{memo.example || "内容なし"}</ReactMarkdown>
                                                                 </div>
                                                            </div>

                                                            <div className="prose prose-blue max-w-none">
                                                                 <h4 className="text-sm font-medium text-gray-500 mb-2">応用例</h4>
                                                                 <div className="bg-gray-50 p-4 rounded-md">
                                                                      <ReactMarkdown components={markdownRenderers}>
                                                                           {memo.application || "内容なし"}
                                                                      </ReactMarkdown>
                                                                 </div>
                                                            </div>

                                                            {memo.reference_url && (
                                                                 <div>
                                                                      <h4 className="text-sm font-medium text-gray-500 mb-2">参考URL</h4>
                                                                      <a
                                                                           href={memo.reference_url}
                                                                           target="_blank"
                                                                           rel="noopener noreferrer"
                                                                           className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                                                                      >
                                                                           {memo.reference_url}
                                                                           <ExternalLink size={14} className="ml-1" />
                                                                      </a>
                                                                 </div>
                                                            )}

                                                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                                                                 <button
                                                                      onClick={() => startEdit(memo)}
                                                                      className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600"
                                                                 >
                                                                      <Edit2 size={16} className="mr-1" />
                                                                      編集
                                                                 </button>
                                                                 <button
                                                                      onClick={() => handleDeleteMemo(memo.id)}
                                                                      className="inline-flex items-center text-sm text-gray-600 hover:text-red-600"
                                                                 >
                                                                      <Trash2 size={16} className="mr-1" />
                                                                      削除
                                                                 </button>
                                                            </div>
                                                       </div>
                                                  )}
                                             </div>
                                        </details>
                                   </div>
                              ))}
                         </div>
                    )}
               </div>

               {isEditModalOpen && editTargetMemo && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                         <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden">
                              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                                   <h2 className="text-lg font-semibold text-gray-900">メモの編集</h2>
                                   <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={20} />
                                   </button>
                              </div>

                              <div className="p-6 max-h-[80vh] overflow-y-auto">
                                   <div className="space-y-5">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                                             <input
                                                  type="text"
                                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                  value={editMemo.title}
                                                  onChange={(e) => setEditMemo({ ...editMemo, title: e.target.value })}
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">使い方</label>
                                             <MDEditor
                                                  value={editMemo.usage}
                                                  onChange={(val = "") => setEditMemo({ ...editMemo, usage: val })}
                                                  preview="edit"
                                                  className="border border-gray-300 rounded-md overflow-hidden"
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">使用例</label>
                                             <MDEditor
                                                  value={editMemo.example}
                                                  onChange={(val = "") => setEditMemo({ ...editMemo, example: val })}
                                                  preview="edit"
                                                  className="border border-gray-300 rounded-md overflow-hidden"
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">応用例</label>
                                             <MDEditor
                                                  value={editMemo.application}
                                                  onChange={(val = "") => setEditMemo({ ...editMemo, application: val })}
                                                  preview="edit"
                                                  className="border border-gray-300 rounded-md overflow-hidden"
                                             />
                                        </div>

                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-1">参考URL</label>
                                             <input
                                                  type="url"
                                                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                  placeholder="https://..."
                                                  value={editMemo.reference_url}
                                                  onChange={(e) => setEditMemo({ ...editMemo, reference_url: e.target.value })}
                                             />
                                        </div>
                                   </div>
                              </div>

                              <div className="flex justify-end gap-3 bg-gray-50 px-6 py-4 border-t border-gray-200">
                                   <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                   >
                                        キャンセル
                                   </button>
                                   <button
                                        onClick={async () => {
                                             const { error, data } = await supabase
                                                  .from("memos")
                                                  .update(editMemo)
                                                  .eq("id", editTargetMemo.id)
                                                  .select()
                                             if (error) {
                                                  toast.error("更新に失敗しました")
                                             } else {
                                                  setMemos((prev) => prev.map((m) => (m.id === editTargetMemo.id ? data[0] : m)))
                                                  toast.success("編集が完了しました")
                                                  setIsEditModalOpen(false)
                                             }
                                        }}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                                   >
                                        保存
                                   </button>
                              </div>
                         </div>
                    </div>
               )}
          </div>
     )
}
