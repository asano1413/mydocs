import Link from "next/link";
import Header from "@/components/Header";

export default function Custom404() {
     return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
               <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
               <p className="text-xl text-gray-700 mb-8">ページが見つかりませんでした。</p>
               <Link href="/" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                    トップページへ戻る
               </Link>
          </div>
     );
}