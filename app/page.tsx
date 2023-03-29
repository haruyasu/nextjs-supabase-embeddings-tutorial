import KnowledgeButton from './components/knowledge/knowledge-button'
import QuestionNew from './components/question/question-new'

// メインページ
const Page = () => {
  return (
    <div className="h-full">
      <KnowledgeButton />
      <QuestionNew />
    </div>
  )
}

export default Page
