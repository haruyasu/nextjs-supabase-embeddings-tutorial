'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import Loading from '../../loading'

const QuestionNew = () => {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAanswer] = useState('')

  // 質問送信
  const onSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()

    if (!question) {
      alert('質問を入力してください')
      return
    }

    setLoading(true)
    setAanswer('')

    // ChatGPTに質問
    const body = JSON.stringify({ question: question.replace(/\n/g, ' ') })
    const response = await fetch('/api/question', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    // エラーチェック
    if (!response.ok) {
      setAanswer('エラーが発生しました')
      setLoading(false)
      return
    }

    const data = response.body

    // データチェック
    if (!data) {
      setAanswer('回答がありません')
      setLoading(false)
      return
    }

    // データ読み込み
    const reader = data.getReader()
    // デコーダー
    const decoder = new TextDecoder()

    let done = false
    while (!done) {
      // データ読み込み
      const { value, done: doneReading } = await reader.read()
      done = doneReading
      // デコード
      const chunkValue = decoder.decode(value)
      // 回答設定
      setAanswer((prev) => prev + chunkValue)
    }

    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="mb-5">
        <div className="mb-5">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            className="focus:outline-none p-2 w-full text-sm bg-gray-50 rounded-lg border border-gray-300 focus:ring-yellow-500 focus:border-yellow-500 focus:ring-2"
            placeholder="質問を入力する"
            disabled={loading}
            required
          />
        </div>

        <div className="flex justify-center">
          {loading ? (
            <Loading />
          ) : (
            <button
              className="bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:ring-yellow-300 focus:outline-none text-white font-medium rounded-lg text-sm px-5 py-3"
              type="submit"
              disabled={loading}
            >
              質問する
            </button>
          )}
        </div>
      </form>

      <div className="flex items-start space-x-5">
        <div className="flex-shrink-0">
          <Image src="/robot.png" className="rounded" alt="image" width={50} height={50} />
        </div>
        <div className="leading-relaxed break-words whitespace-pre-wrap">
          <AnimatePresence mode="wait">
            <motion.div>
              {answer ? (
                answer.split('URL:').map((data, index) => {
                  const content = data.trim()

                  return (
                    <div key={index}>
                      {index === 0 ? (
                        <div>{content}</div>
                      ) : (
                        <div className="mt-5">
                          <div>URL:</div>
                          <div className="flex flex-col items-start">
                            {content.split('\n').map((url, index2) => {
                              return (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  key={index2}
                                >
                                  <div className="underline text-blue-500">{url}</div>
                                </a>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : loading ? (
                <div>少々お待ち下さい...</div>
              ) : (
                <div>何でも質問してね</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default QuestionNew
