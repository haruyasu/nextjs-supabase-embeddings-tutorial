import { supabase } from '../../utils/supabase-js'
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import GPT3Tokenizer from 'gpt3-tokenizer'

// 環境変数設定
const openai_api_key = process.env.OPENAI_API_KEY

interface DocumentType {
  id: string
  content: string
  url: string
  similarity: string
}

export const config = {
  runtime: 'edge',
}

const headers = {
  Authorization: `Bearer ${openai_api_key}`,
  'Content-Type': 'application/json',
}

const embeddings_url = 'https://api.openai.com/v1/embeddings'
const chat_completions_url = 'https://api.openai.com/v1/chat/completions'

const handler = async (req: Request): Promise<Response> => {
  try {
    const { question } = await req.json()

    // Embeddings
    // 質問をベクトルに変換
    const res_embedding = await fetch(embeddings_url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        input: question,
        model: 'text-embedding-ada-002',
      }),
    })

    const embeddingData = await res_embedding.json()
    // ベクトル取得
    const [{ embedding }] = embeddingData.data

    // データベースにある文章から質問と関連性の高い文章を取得
    const { data: matchDocuments } = await supabase
      .rpc('match_documents', {
        query_embedding: embedding,
        similarity_threshold: 0.1,
        match_count: 5,
      })
      .returns<DocumentType[]>()

    // トークン
    const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
    let count = 0
    let context = ''
    const urls: string[] = []

    // 文章生成
    matchDocuments &&
      matchDocuments.forEach((document) => {
        const content = document.content
        // トークン取得
        const encoded = tokenizer.encode(content)
        count += encoded.text.length
        // トークンが1500以上の場合で終了
        if (count > 1500) {
          return
        }

        // 文章設定
        context += `${content.trim()}\n`
        // URL設定
        urls.push(document.url)
      })

    // URL重複削除
    const setUrls = new Set(urls)
    const uniqueUrls = Array.from(setUrls)

    // メッセージ
    const messages = [
      {
        role: 'system',
        content:
          'あなたはとても親切なアシスタントです。文章が与えられたら、その文章だけを使用して質問に答えてください。',
      },
      {
        role: 'user',
        content: `文章: ${context}\n質問: ${question}`,
      },
    ]

    // ChatGPT
    // 質問の回答を文章から生成
    const res_answer = await fetch(chat_completions_url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        stream: true,
      }),
    })

    // エンコーダー
    const encoder = new TextEncoder()
    // デコーダー
    const decoder = new TextDecoder()

    // ReadableStream ストリーミングデータを読み込むためのAPI
    // データをチャンク(小さな部分)に分割して非同期に処理
    const stream = new ReadableStream({
      // ストリーム初期化
      async start(controller) {
        const onParse = (event: ParsedEvent | ReconnectInterval) => {
          if (event.type === 'event') {
            const data = event.data

            // 終了した場合[DONE]となる
            if (data === '[DONE]') {
              // 最後にURLを送信
              const url_content = '\nURL:\n' + uniqueUrls.join('\n')
              const queue = encoder.encode(url_content)
              controller.enqueue(queue)
              // 終了
              controller.close()
              return
            }

            try {
              const json = JSON.parse(data)
              const content = json.choices[0].delta.content
              const queue = encoder.encode(content)
              // 分割したデータを送信
              controller.enqueue(queue)
            } catch (e) {
              controller.error(e)
            }
          }
        }

        // サーバー送信イベント(SSE)のデータを解析するためのオブジェクトを生成
        // SSEデータはサーバーからクライアントへのリアルタイムな一方向通信に使用されるテキストベースのデータ形式
        const parser = createParser(onParse)

        // 回答を分割
        for await (const chunk of res_answer.body as any) {
          parser.feed(decoder.decode(chunk))
        }
      },
    })

    // クライアントに送信
    return new Response(stream)
  } catch (error) {
    console.error(error)
    return new Response('サーバーエラーが発生しました', { status: 400 })
  }
}

export default handler
