import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import type {
  PageObjectResponse,
  QueryDatabaseParameters,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints'
import type { ContentSourceAdapter, RawPost } from '@/lib/content/types'

type NotionFilter = NonNullable<QueryDatabaseParameters['filter']>

/**
 * Describes one Notion database used as a post source.
 * Each database may name its properties differently, so the mapping lives here.
 */
interface NotionSourceConfig {
  databaseId: string | undefined
  properties: {
    title: string
    slug: string
    description: string
    category: string
    tags: string
    publishedDate: string
    coverImage?: string
  }
  /** Rows matching this filter are considered published. */
  publishedFilter: NotionFilter
  /** Drop a leading `# Title` line when the page body repeats the title. */
  stripLeadingTitle?: boolean
}

let _client: Client | null = null

function getClient(): Client {
  if (!_client) {
    _client = new Client({ auth: process.env.NOTION_API_KEY })
  }
  return _client
}

function getTextProperty(page: PageObjectResponse, name: string): string {
  const prop = page.properties[name]
  if (prop?.type === 'title') {
    return prop.title.map((t) => t.plain_text).join('')
  }
  if (prop?.type === 'rich_text') {
    return prop.rich_text.map((t) => t.plain_text).join('')
  }
  return ''
}

function getSelectProperty(page: PageObjectResponse, name: string): string | null {
  const prop = page.properties[name]
  if (prop?.type === 'select') {
    return prop.select?.name ?? null
  }
  return null
}

function getMultiSelectProperty(
  page: PageObjectResponse,
  name: string
): string[] {
  const prop = page.properties[name]
  if (prop?.type === 'multi_select') {
    return prop.multi_select.map((s) => s.name)
  }
  return []
}

function getDateProperty(page: PageObjectResponse, name: string): string {
  const prop = page.properties[name]
  if (prop?.type === 'date') {
    return prop.date?.start ?? ''
  }
  return ''
}

function getUrlProperty(page: PageObjectResponse, name: string): string | null {
  const prop = page.properties[name]
  if (prop?.type === 'url') {
    return prop.url ?? null
  }
  return null
}

function isFullPage(
  result: QueryDatabaseResponse['results'][number]
): result is PageObjectResponse {
  return result.object === 'page' && 'properties' in result
}

export function mapPageToRawPost(
  page: PageObjectResponse,
  props: NotionSourceConfig['properties']
): RawPost {
  return {
    id: page.id,
    title: getTextProperty(page, props.title),
    slug: getTextProperty(page, props.slug),
    description: getTextProperty(page, props.description),
    category: getSelectProperty(page, props.category),
    tags: getMultiSelectProperty(page, props.tags),
    publishedDate: getDateProperty(page, props.publishedDate),
    coverImage: props.coverImage ? getUrlProperty(page, props.coverImage) : null,
    source: 'notion',
  }
}

export function stripLeadingTitle(markdown: string, title: string): string {
  const match = markdown.match(/^\s*#\s+(.+?)\s*(?:\n|$)/)
  if (match && match[1].trim() === title.trim()) {
    return markdown.slice(match[0].length).replace(/^\s+/, '')
  }
  return markdown
}

/** Query every matching row, following Notion's 100-row pagination. */
async function queryAll(
  databaseId: string,
  filter: NotionFilter,
  sorts?: QueryDatabaseParameters['sorts']
): Promise<PageObjectResponse[]> {
  const notion = getClient()
  const pages: PageObjectResponse[] = []
  let cursor: string | undefined

  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter,
      sorts,
      start_cursor: cursor,
    })
    pages.push(...response.results.filter(isFullPage))
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined
  } while (cursor)

  return pages
}

async function getPostContent(pageId: string): Promise<string> {
  const n2m = new NotionToMarkdown({ notionClient: getClient() })
  const mdBlocks = await n2m.pageToMarkdown(pageId)
  return n2m.toMarkdownString(mdBlocks).parent
}

export function createNotionAdapter(config: NotionSourceConfig): ContentSourceAdapter {
  const { databaseId, properties: props, publishedFilter } = config
  const isConfigured = Boolean(process.env.NOTION_API_KEY) && Boolean(databaseId)

  return {
    source: 'notion',
    enabled: isConfigured,

    async listPosts(): Promise<RawPost[]> {
      if (!isConfigured) return []
      const pages = await queryAll(databaseId!, publishedFilter, [
        { property: props.publishedDate, direction: 'descending' },
      ])
      return pages.map((page) => mapPageToRawPost(page, props))
    },

    async getPostBySlug(slug: string): Promise<RawPost | null> {
      if (!isConfigured) return null

      // Notion allows at most two levels of compound-filter nesting, so merge the
      // slug condition into an existing top-level `and` instead of wrapping it.
      const slugFilter = { property: props.slug, rich_text: { equals: slug } }
      const filter =
        'and' in publishedFilter
          ? { and: [slugFilter, ...publishedFilter.and] }
          : { and: [slugFilter, publishedFilter] }
      const pages = await queryAll(databaseId!, filter as NotionFilter)

      const page = pages[0]
      if (!page) return null

      const post = mapPageToRawPost(page, props)
      let content = await getPostContent(page.id)
      if (config.stripLeadingTitle) {
        content = stripLeadingTitle(content, post.title)
      }
      return { ...post, content }
    },
  }
}

/** "Blog Posts" database — see aidlc-docs/construction/blog-v2/notion-setup-guide.md */
export const notionAdapter = createNotionAdapter({
  databaseId: process.env.NOTION_DATABASE_ID,
  properties: {
    title: 'Title',
    slug: 'Slug',
    description: 'Description',
    category: 'Category',
    tags: 'Tags',
    publishedDate: 'PublishedDate',
    coverImage: 'CoverImage',
  },
  publishedFilter: { property: 'Status', select: { equals: 'Published' } },
})

const BRIEFING_STATUSES = (process.env.NOTION_BRIEFING_STATUSES ?? 'Researched,Published')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

/**
 * "AI Web Dev Researches" database (AI 웹 개발 기술 브리핑).
 * A row is published when its Status is in NOTION_BRIEFING_STATUSES or "Blog Ready" is checked,
 * and it has a Slug.
 */
export const notionBriefingAdapter = createNotionAdapter({
  databaseId: process.env.NOTION_BRIEFING_DATABASE_ID,
  properties: {
    title: 'Name',
    slug: 'Slug',
    description: 'Description',
    category: 'Category',
    tags: 'Tags',
    publishedDate: 'Date',
  },
  publishedFilter: {
    and: [
      { property: 'Slug', rich_text: { is_not_empty: true } },
      {
        or: [
          ...BRIEFING_STATUSES.map((status) => ({
            property: 'Status',
            select: { equals: status },
          })),
          { property: 'Blog Ready', checkbox: { equals: true } },
        ],
      },
    ],
  } as NotionFilter,
  stripLeadingTitle: true,
})
