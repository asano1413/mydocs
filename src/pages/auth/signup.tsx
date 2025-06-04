import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function SignupPage() {
     const [email, setEmail] = useState('')
     const [password, setPassword] = useState('')
     const [username, setUsername] = useState('')
     const [success, setSuccess] = useState('')
     const [error, setError] = useState('')
     const router = useRouter()

     const handleSignup = async () => {
          setError('')
          setSuccess('')
          if (!email || !password || !username) {
               setError('全ての項目を入力してください')
               return
          }
          const { data, error } = await supabase.auth.signUp({ email, password })
          if (error) {
               setError(error.message)
          } else {
               if (data.user) {
                    await supabase.from('profiles').insert([
                         { id: data.user.id, username }
                    ])
               }
               setSuccess('確認メールを送信しました！')
          }
     }

     return (
          <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
               <h1 className='mb-12 text-4xl text-blue-800'>MY DOCS</h1>
               <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">ユーザー登録</h2>
                    <input
                         className="w-full p-3 mb-4 text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                         type="text"
                         placeholder="ユーザー名"
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                         className="w-full p-3 mb-4 text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                         type="email"
                         placeholder="メールアドレス"
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                         className="w-full p-3 mb-4 text-gray-700 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200"
                         type="password"
                         placeholder="パスワード"
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                         onClick={handleSignup}
                         className="w-full mt-6 bg-sky-500 hover:bg-sky-600 hover:cursor-pointer text-white py-2 rounded font-semibold transition"
                    >
                         サインアップ
                    </button>
                    {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
                    {success && <p className="text-green-600 mt-3 text-center">{success}</p>}
                    <Link className='text-blue-500 hover:underline mt-4 block text-center' href="/auth/login">
                         すでにアカウントをお持ちの方はこちら
                    </Link>
               </div>
          </div>
     )
}