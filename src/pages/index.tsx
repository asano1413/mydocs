"use client"

import { SetStateAction, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import Header from "@/components/Header"
import dayjs from "dayjs"
import "dayjs/locale/ja"
import { Plus, Search, Edit2, Trash2, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

dayjs.locale("ja")

type Category = {
  id: string
  name: string
  created_at: string
  memos: { count: number }[]
}

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState("")
  const [filtered, setFiltered] = useState<Category[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push("/login")
      }
    }

    const fetchData = async () => {
      const { data: user } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          created_at,
          memos(count)
        `)
        .eq("user_id", user?.user?.id)
        .order("created_at", { ascending: false })

      if (error) {
        setErrorMessage("カテゴリの取得に失敗しました。")
      } else if (data) {
        setCategories(data as Category[])
        setFiltered(data as Category[])
      }
    }

    checkAuth()
    fetchData()
  }, [router])

  useEffect(() => {
    const filteredData = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    setFiltered(filteredData)
  }, [search, categories])

  const handleAddCategory = async () => {
    setErrorMessage("")
    const { data: user } = await supabase.auth.getUser()
    const userId = user?.user?.id

    if (!newCategory.trim() || !userId) {
      setErrorMessage("カテゴリ名を入力してください。")
      return
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: newCategory.trim(),
          user_id: userId,
        },
      ])
      .select()

    if (error) {
      setErrorMessage("カテゴリの追加に失敗しました。")
      return
    }

    if (data) {
      const newCat = data[0] as Category
      setCategories((prev) => [newCat, ...prev])
      setFiltered((prev) => [newCat, ...prev])
      setNewCategory("")
      setIsAdding(false)
    }
  }

  const handleUpdateCategory = async () => {
    setErrorMessage("")
    if (!editName.trim() || !editingCategory) {
      setErrorMessage("カテゴリ名を入力してください。")
      return
    }

    const { error } = await supabase.from("categories").update({ name: editName }).eq("id", editingCategory.id)

    if (error) {
      setErrorMessage("カテゴリの更新に失敗しました。")
    } else {
      const updated = categories.map((c) => (c.id === editingCategory.id ? { ...c, name: editName } : c))
      setCategories(updated)
      setFiltered(updated)
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = async () => {
    setErrorMessage("")
    if (!deletingCategory) return

    const { error } = await supabase.from("categories").delete().eq("id", deletingCategory.id)

    if (error) {
      setErrorMessage("カテゴリの削除に失敗しました。")
    } else {
      const updated = categories.filter((c) => c.id !== deletingCategory.id)
      setCategories(updated)
      setFiltered(updated)
      setDeletingCategory(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">カテゴリ一覧</h1>
          <p className="text-slate-600">メモを整理するためのカテゴリを管理できます</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="カテゴリ名で絞り込み..."
              className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              value={search}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setSearch(e.target.value)}
            />
          </div>

          <Dialog open={isAdding} onOpenChange={setIsAdding}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                新しいカテゴリ
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>新しいカテゴリを追加</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="カテゴリ名を入力..."
                  value={newCategory}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setNewCategory(e.target.value)}
                  onKeyPress={(e: { key: string }) => e.key === "Enter" && handleAddCategory()}
                />
                <div className="flex justify-end gap-2">
                  <button className="bg-gray-50 border p-2 rounded-md border-red-400 text-red-500 hover:bg-red-400 hover:text-gray-50" onClick={() => setIsAdding(false)}>
                    キャンセル
                  </button>
                  <Button onClick={handleAddCategory} className="bg-blue-600 hover:bg-blue-700">
                    追加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((category) => (
            <Card
              key={category.id}
              className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900 truncate">{category.name}</CardTitle>
                  <div className="flex gap-1 ml-2">
                    <Dialog
                      open={editingCategory?.id === category.id}
                      onOpenChange={(open: any) => {
                        if (open) {
                          setEditingCategory(category)
                          setEditName(category.name)
                        } else {
                          setEditingCategory(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>カテゴリを編集</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            value={editName}
                            onChange={(e: { target: { value: SetStateAction<string> } }) => setEditName(e.target.value)}
                            onKeyPress={(e: { key: string }) => e.key === "Enter" && handleUpdateCategory()}
                          />
                          <div className="flex justify-end gap-2">
                            <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setEditingCategory(null)}>
                              キャンセル
                            </Button>
                            <Button onClick={handleUpdateCategory} className="bg-blue-600 hover:bg-blue-700">
                              更新
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog
                      open={deletingCategory?.id === category.id}
                      onOpenChange={(open: any) => {
                        if (!open) setDeletingCategory(null)
                      }}
                    >
                      <Button
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-600"
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            この操作は取り消せません。カテゴリ「{category.name}
                            」とそれに関連するすべてのメモが削除されます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
                            削除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{category.memos?.[0]?.count || 0} 件のメモ</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {dayjs(category.created_at).format("YYYY年MM月DD日")}
                    </span>
                  </div>

                  <Link href={`/category/${category.id}`}>
                    <Button className="w-full mt-4 border-slate-200 hover:bg-slate-50">
                      メモを見る
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {search ? "該当するカテゴリが見つかりません" : "カテゴリがありません"}
            </h3>
            <p className="text-slate-600 mb-6">
              {search ? "検索条件を変更してみてください" : "最初のカテゴリを作成してメモの整理を始めましょう"}
            </p>
            {!search && (
              <Button onClick={() => setIsAdding(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                カテゴリを作成
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
