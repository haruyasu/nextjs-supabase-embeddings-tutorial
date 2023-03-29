'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Loading from '../../loading'

type Props = {
  knowledge_urls:
    | {
        url: string
      }[]
    | null
}

const KnowledgeNew: React.FC<Props> = ({ knowledge_urls }) => {
  const [urls, setUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  // 送信
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // 知識データベースに保存
    const body = JSON.stringify({ urls })
    const response = await fetch('/api/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    // エラーチェック
    if (!response.ok) {
      alert('データベースが作成できませんでした')
      setLoading(false)
      return
    }

    setMessage('データベースに追加されました')
    setUrls([])
    router.refresh()
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-3 text-center text-xl font-bold">知識データベース</div>
      <div className="mb-5 text-center">指定したURLの文章を知識データベースに追加します</div>
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <textarea
            className="focus:outline-none p-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 focus:ring-2"
            rows={10}
            placeholder="URLを入力(複数URLは改行)"
            value={urls.join('\n')}
            onChange={(e) => setUrls(e.target.value.split('\n'))}
            disabled={loading}
          />
        </div>

        <div className="text-center my-5 font-bold text-red-500">{message}</div>

        <div className="flex justify-center mb-5">
          {loading ? (
            <Loading />
          ) : (
            <button
              className="bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 focus:outline-none text-white font-medium rounded-lg text-sm px-5 py-3"
              type="submit"
              disabled={loading}
            >
              追加する
            </button>
          )}
        </div>
      </form>

      <div>
        <div className="text-center font-bold mb-5">格納URL</div>
        {knowledge_urls && knowledge_urls.length ? (
          <div className="border rounded">
            {knowledge_urls.map((data, index) => {
              return (
                <a href={data.url} key={index} target="_blank" rel="noopener noreferrer">
                  <div
                    className={`${
                      knowledge_urls.length - 1 != index && 'border-b'
                    } p-2 text-blue-500 underline hover:bg-gray-100`}
                  >
                    {data.url}
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="text-center">知識データベースがありません</div>
        )}
      </div>
    </div>
  )
}

export default KnowledgeNew
