"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { supabase } from "@/lib/supabase"
import toast, { Toaster } from "react-hot-toast"
import Header from "@/components/Header"
import { User, Mail, Camera, Save, Edit2, Shield, Bell, Trash2, Eye, EyeOff } from "lucide-react"

interface UserProfile {
     id: string
     email: string
     full_name: string
     avatar_url: string
     bio: string
     website: string
     location: string
     created_at: string
}

export default function ProfilePage() {
     const router = useRouter()
     const [loading, setLoading] = useState(true)
     const [saving, setSaving] = useState(false)
     const [user, setUser] = useState<any>(null)
     const [profile, setProfile] = useState<UserProfile | null>(null)
     const [isEditing, setIsEditing] = useState(false)
     const [editForm, setEditForm] = useState({
          full_name: "",
          bio: "",
          website: "",
          location: "",
     })
     const [passwordForm, setPasswordForm] = useState({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
     })
     const [showPasswords, setShowPasswords] = useState({
          current: false,
          new: false,
          confirm: false,
     })
     const [avatarFile, setAvatarFile] = useState<File | null>(null)
     const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
     const [isChangingPassword, setIsChangingPassword] = useState(false)
     const [notifications, setNotifications] = useState({
          email_notifications: true,
          push_notifications: false,
          marketing_emails: false,
     })

     useEffect(() => {
          checkUser()
     }, [])
     const checkUser = async () => {
          try {
               const { data: { session } } = await supabase.auth.getSession()

               if (!session) {
                    router.push("/login")
                    return
               }

               const currentUser = session.user
               setUser(currentUser)
               await fetchProfile({ id: currentUser.id, email: currentUser.email ?? "" })
          } catch (error) {
               console.error("Error checking user:", error)
               toast.error("ユーザー情報の取得に失敗しました")
          } finally {
               setLoading(false)
          }
     }


     const fetchProfile = async (user: { id: string; email: string | undefined }) => {
          try {
               const { data, error, status } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single()

               if (error && status !== 406) {
                    throw error
               }

               if (data) {
                    setProfile(data)
                    setEditForm({
                         full_name: data.full_name || "",
                         bio: data.bio || "",
                         website: data.website || "",
                         location: data.location || "",
                    })
               } else {
                    if (!user.email) {
                         throw new Error("ユーザーのemailが取得できません")
                    }

                    const newProfile = {
                         id: user.id,
                         email: user.email,
                         full_name: "",
                         avatar_url: "",
                         bio: "",
                         website: "",
                         location: "",
                    }

                    const { data: createdProfile, error: createError } = await supabase
                         .from("profiles")
                         .insert([newProfile])
                         .select()
                         .single()

                    if (createError) throw createError
                    setProfile(createdProfile)
               }
          } catch (error) {
               console.error("❌ Error fetching profile:", error)
               toast.error("プロフィール情報の取得に失敗しました")
          }
     }
     const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (file) {
               if (file.size > 5 * 1024 * 1024) {
                    toast.error("ファイルサイズは5MB以下にしてください")
                    return
               }

               setAvatarFile(file)
               const reader = new FileReader()
               reader.onload = (e) => {
                    setAvatarPreview(e.target?.result as string)
               }
               reader.readAsDataURL(file)
          }
     }

     const uploadAvatar = async () => {
          if (!avatarFile || !user) return null

          const fileExt = avatarFile.name.split(".").pop()
          const fileName = `${user.id}-${Math.random()}.${fileExt}`
          const filePath = `avatars/${fileName}`

          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile)

          if (uploadError) {
               throw uploadError
          }

          const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)

          return data.publicUrl
     }

     const handleSaveProfile = async () => {
          if (!user || !profile) return

          setSaving(true)
          try {
               let avatarUrl = profile.avatar_url

               if (avatarFile) {
                    const uploadedUrl = await uploadAvatar()
                    avatarUrl = uploadedUrl ?? profile.avatar_url
               }

               const { error } = await supabase
                    .from("profiles")
                    .update({
                         ...editForm,
                         avatar_url: avatarUrl,
                    })
                    .eq("id", user.id)

               if (error) throw error

               setProfile({
                    ...profile,
                    ...editForm,
                    avatar_url: avatarUrl || profile.avatar_url,
               })

               setIsEditing(false)
               setAvatarFile(null)
               setAvatarPreview(null)
               toast.success("プロフィールを更新しました")
          } catch (error) {
               console.error("Error updating profile:", error)
               toast.error("プロフィールの更新に失敗しました")
          } finally {
               setSaving(false)
          }
     }

     const handleChangePassword = async () => {
          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
               toast.error("新しいパスワードが一致しません")
               return
          }

          if (passwordForm.newPassword.length < 6) {
               toast.error("パスワードは6文字以上で入力してください")
               return
          }

          try {
               const { error } = await supabase.auth.updateUser({
                    password: passwordForm.newPassword,
               })

               if (error) throw error

               setPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
               })
               setIsChangingPassword(false)
               toast.success("パスワードを変更しました")
          } catch (error) {
               console.error("Error changing password:", error)
               toast.error("パスワードの変更に失敗しました")
          }
     }

     const handleDeleteAccount = async () => {
          if (!confirm("アカウントを削除してもよろしいですか？この操作は取り消せません。")) {
               return
          }

          try {
               const { error } = await supabase.auth.admin.deleteUser(user.id)
               if (error) throw error

               toast.success("アカウントを削除しました")
               router.push("/")
          } catch (error) {
               console.error("Error deleting account:", error)
               toast.error("アカウントの削除に失敗しました")
          }
     }

     if (loading) {
          return (
               <div className="min-h-screen bg-gray-50">
                    <Header />
                    <div className="max-w-4xl mx-auto py-8 px-4">
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                              <div className="animate-pulse">
                                   <div className="flex items-center space-x-4">
                                        <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                                        <div className="space-y-2">
                                             <div className="h-4 bg-gray-200 rounded w-32"></div>
                                             <div className="h-3 bg-gray-200 rounded w-48"></div>
                                        </div>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          )
     }

     return (
          <div className="min-h-screen bg-gray-50">
               <Toaster position="top-right" />
               <Header />

               <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
                    <div className="mb-8">
                         <h1 className="text-3xl font-bold text-gray-900">プロフィール</h1>
                         <p className="text-gray-500 mt-1">アカウント情報と設定を管理</p>
                    </div>

                    <div className="space-y-6">
                         <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>
                              <div className="px-6 pb-6">
                                   <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-6 -mt-16">
                                        <div className="relative">
                                             <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                                                  {avatarPreview ? (
                                                       <img
                                                            src={avatarPreview || "/placeholder.svg"}
                                                            alt="Avatar preview"
                                                            className="w-full h-full object-cover"
                                                       />
                                                  ) : profile?.avatar_url ? (
                                                       <img
                                                            src={profile.avatar_url || "/placeholder.svg"}
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                       />
                                                  ) : (
                                                       <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <User size={48} className="text-gray-400" />
                                                       </div>
                                                  )}
                                             </div>
                                             {isEditing && (
                                                  <label className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                                                       <Camera size={16} />
                                                       <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                                  </label>
                                             )}
                                        </div>

                                        <div className="mt-4 sm:mt-0 flex-grow">
                                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                  <div>
                                                       <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || "名前未設定"}</h2>
                                                       <p className="text-gray-500 flex items-center mt-1">
                                                            <Mail size={16} className="mr-1" />
                                                            {user?.email}
                                                       </p>
                                                  </div>
                                                  <div className="mt-4 sm:mt-0">
                                                       {!isEditing ? (
                                                            <button
                                                                 onClick={() => setIsEditing(true)}
                                                                 className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                                                            >
                                                                 <Edit2 size={16} className="mr-2" />
                                                                 編集
                                                            </button>
                                                       ) : (
                                                            <div className="flex gap-2">
                                                                 <button
                                                                      onClick={() => {
                                                                           setIsEditing(false)
                                                                           setAvatarFile(null)
                                                                           setAvatarPreview(null)
                                                                      }}
                                                                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
                                                                 >
                                                                      キャンセル
                                                                 </button>
                                                                 <button
                                                                      onClick={handleSaveProfile}
                                                                      disabled={saving}
                                                                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                                                                 >
                                                                      <Save size={16} className="mr-2" />
                                                                      {saving ? "保存中..." : "保存"}
                                                                 </button>
                                                            </div>
                                                       )}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   {isEditing ? (
                                        <div className="mt-6 space-y-4">
                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                                                  <input
                                                       type="text"
                                                       value={editForm.full_name}
                                                       onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                                       className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                       placeholder="お名前を入力"
                                                  />
                                             </div>

                                             <div>
                                                  <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
                                                  <textarea
                                                       value={editForm.bio}
                                                       onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                       rows={3}
                                                       className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                       placeholder="自己紹介を入力"
                                                  />
                                             </div>

                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">ウェブサイト</label>
                                                       <input
                                                            type="url"
                                                            value={editForm.website}
                                                            onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="https://..."
                                                       />
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">所在地</label>
                                                       <input
                                                            type="text"
                                                            value={editForm.location}
                                                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="東京, 日本"
                                                       />
                                                  </div>
                                             </div>
                                        </div>
                                   ) : (
                                        <div className="mt-6 space-y-3">
                                             {profile?.bio && <p className="text-gray-700">{profile.bio}</p>}
                                             <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                  {profile?.website && (
                                                       <a
                                                            href={profile.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="hover:text-blue-600"
                                                       >
                                                            🌐 {profile.website}
                                                       </a>
                                                  )}
                                                  {profile?.location && <span>📍 {profile.location}</span>}
                                                  <span>📅 {new Date(profile?.created_at || "").toLocaleDateString("ja-JP")}に参加</span>
                                             </div>
                                        </div>
                                   )}
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Shield size={20} className="mr-2" />
                                        セキュリティ設定
                                   </h3>
                              </div>

                              <div className="p-6">
                                   <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                             <div>
                                                  <h4 className="font-medium text-gray-900">パスワード</h4>
                                                  <p className="text-sm text-gray-500">
                                                       アカウントのセキュリティを保護するため定期的に変更してください
                                                  </p>
                                             </div>
                                             <button
                                                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                             >
                                                  {isChangingPassword ? "キャンセル" : "変更"}
                                             </button>
                                        </div>

                                        {isChangingPassword && (
                                             <div className="bg-gray-50 p-4 rounded-md space-y-3">
                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">現在のパスワード</label>
                                                       <div className="relative">
                                                            <input
                                                                 type={showPasswords.current ? "text" : "password"}
                                                                 value={passwordForm.currentPassword}
                                                                 onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                                 className="w-full text-gray-600 p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <button
                                                                 type="button"
                                                                 onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                                 className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                 {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                       </div>
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード</label>
                                                       <div className="relative">
                                                            <input
                                                                 type={showPasswords.new ? "text" : "password"}
                                                                 value={passwordForm.newPassword}
                                                                 onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                                 className="w-full text-gray-600 p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <button
                                                                 type="button"
                                                                 onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                                 className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                 {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                       </div>
                                                  </div>

                                                  <div>
                                                       <label className="block text-sm font-medium text-gray-700 mb-1">新しいパスワード（確認）</label>
                                                       <div className="relative">
                                                            <input
                                                                 type={showPasswords.confirm ? "text" : "password"}
                                                                 value={passwordForm.confirmPassword}
                                                                 onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                                 className="w-full text-gray-600 p-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                            <button
                                                                 type="button"
                                                                 onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                                 className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                                                            >
                                                                 {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                                            </button>
                                                       </div>
                                                  </div>

                                                  <button
                                                       onClick={handleChangePassword}
                                                       className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md transition-colors"
                                                  >
                                                       パスワードを変更
                                                  </button>
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                              <div className="px-6 py-4 border-b border-gray-200">
                                   <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <Bell size={20} className="mr-2" />
                                        通知設定
                                   </h3>
                              </div>

                              <div className="p-6 space-y-4">
                                   <div className="flex items-center justify-between">
                                        <div>
                                             <h4 className="font-medium text-gray-900">メール通知</h4>
                                             <p className="text-sm text-gray-500">重要な更新をメールで受け取る</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                             <input
                                                  type="checkbox"
                                                  checked={notifications.email_notifications}
                                                  onChange={(e) => setNotifications({ ...notifications, email_notifications: e.target.checked })}
                                                  className="sr-only peer"
                                             />
                                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                   </div>

                                   <div className="flex items-center justify-between">
                                        <div>
                                             <h4 className="font-medium text-gray-900">プッシュ通知</h4>
                                             <p className="text-sm text-gray-500">ブラウザでプッシュ通知を受け取る</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                             <input
                                                  type="checkbox"
                                                  checked={notifications.push_notifications}
                                                  onChange={(e) => setNotifications({ ...notifications, push_notifications: e.target.checked })}
                                                  className="sr-only peer"
                                             />
                                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                   </div>

                                   <div className="flex items-center justify-between">
                                        <div>
                                             <h4 className="font-medium text-gray-900">マーケティングメール</h4>
                                             <p className="text-sm text-gray-500">新機能やキャンペーンの情報を受け取る</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                             <input
                                                  type="checkbox"
                                                  checked={notifications.marketing_emails}
                                                  onChange={(e) => setNotifications({ ...notifications, marketing_emails: e.target.checked })}
                                                  className="sr-only peer"
                                             />
                                             <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                   </div>
                              </div>
                         </div>

                         <div className="bg-white rounded-lg shadow-sm border border-red-200">
                              <div className="px-6 py-4 border-b border-red-200">
                                   <h3 className="text-lg font-semibold text-red-600 flex items-center">
                                        <Trash2 size={20} className="mr-2" />
                                        アカウント削除
                                   </h3>
                              </div>

                              <div className="p-6">
                                   <div className="flex items-center justify-between">
                                        <div>
                                             <h4 className="font-medium text-gray-900">アカウントの削除</h4>
                                             <p className="text-sm text-gray-500">
                                                  アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。
                                             </p>
                                        </div>
                                        <button
                                             onClick={handleDeleteAccount}
                                             className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                                        >
                                             アカウント削除
                                        </button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     )
}
