import Link from 'next/link'

export default function PostNotFound() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 py-32 text-center">
      <h1 className="text-3xl font-bold text-foreground">글을 찾을 수 없습니다</h1>
      <p className="text-muted-foreground">
        요청하신 글이 존재하지 않거나 삭제되었습니다.
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
