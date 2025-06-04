import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

export default function LoginPage() {
     const [email, setEmail] = useState('')
     const [password, setPassword] = useState('')
     const [error, setError] = useState('')
     const router = useRouter()

     const handleLogin = async () => {
          setError('')
          const { error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) {
               setError(error.message)
          } else {
               router.push('/')
          }
     }

     return (
          <>
               <Head>
                    <title>ログイン - MY DOCS</title>
                    <link rel="icon" href="/favicon.svg" />
               </Head>
               <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
                    <h1 className='mb-12 text-4xl text-blue-800'>MY DOCS</h1>
                    <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                         <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">ログイン</h2>
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
                              onClick={handleLogin}
                              className="w-full mt-6 bg-sky-500 hover:bg-sky-600 hover:cursor-pointer text-white py-2 rounded font-semibold transition"
                         >
                              ログイン
                         </button>
                         {error && <p className="text-red-500 mt-3 text-center">{error}</p>}
                         <Link href="/auth/signup" legacyBehavior>
                              <a className="text-blue-500 hover:underline mt-4 block text-center">
                                   まだアカウントをお持ちでない方はこちら
                              </a>
                         </Link>
                    </div>
               </div>
          </>
     )
}