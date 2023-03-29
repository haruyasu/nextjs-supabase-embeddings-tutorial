import { createClient } from '../../utils/supabase-server'
import KnowledgeNew from '../components/knowledge/knowledge-new'

type UrlType = {
  url: string
}[]

const Knowledge = async () => {
  const supabase = createClient()

  // 知識データベースリスト取得
  const { data } = await supabase.from('distinct_url').select().returns<UrlType>()

  return <KnowledgeNew knowledge_urls={data} />
}

export default Knowledge
