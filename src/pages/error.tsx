import Link from "next/link";
import Header from "@/components/Header";

type ErrorProps = {
     statusCode?: number;
     title?: string;
};

export default function Error({ statusCode, title }: ErrorProps) {
     return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
               <Header />
               <h1 className="text-6xl font-bold text-red-500 mb-4">
                    {statusCode || "エラー"}
               </h1>
               <p className="text-xl text-gray-700 mb-4">
                    {title || "予期しないエラーが発生しました。"}
               </p>
               <Link href="/">
                    <a className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                         トップページへ戻る
                    </a>
               </Link>
          </div>
     );
}

Error.getInitialProps = ({ res, err }: any) => {
     const statusCode = res?.statusCode || err?.statusCode || 500;
     return { statusCode };
};