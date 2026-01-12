export interface Deal {
    id: string
    toolId: string
    toolName: string
    discount: string
    code: string | null
    description: string
    expiresAt: string | null
}

export const mockTools = [
    { id: '1', name: 'Jasper AI' },
    { id: '2', name: 'Midjourney' },
    { id: '3', name: 'Copy.ai' },
    { id: '4', name: 'RunwayML' },
]

export const mockDeals: Deal[] = [
    {
        id: '1',
        toolId: '1',
        toolName: 'Jasper AI',
        discount: '20% OFF',
        code: 'JASPER20',
        description: 'Get 20% off your first 3 months.',
        expiresAt: '2025-12-31'
    },
    {
        id: '2',
        toolId: '2',
        toolName: 'Midjourney',
        discount: 'Free Trial',
        code: null,
        description: '7-day free trial for new users.',
        expiresAt: '2025-06-30'
    }
]

export interface BlogPost {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    readTime: number
    publishedAt: string
}

export const mockBlogPosts: BlogPost[] = [
    {
        id: '1',
        title: 'Top 10 AI Tools for Designers in 2025',
        slug: 'top-10-ai-tools-designers-2025',
        excerpt: 'Discover the best AI tools that are revolutionizing the design industry this year.',
        content: 'Full article content here...',
        category: 'Listicles',
        readTime: 5,
        publishedAt: '2025-12-15'
    },
    {
        id: '2',
        title: 'How to use Midjourney V6 like a Pro',
        slug: 'how-to-use-midjourney-v6',
        excerpt: 'A comprehensive guide to mastering the latest version of Midjourney.',
        content: 'Full article content here...',
        category: 'Tutorials',
        readTime: 8,
        publishedAt: '2025-12-20'
    },
    {
        id: '3',
        title: 'ChatGPT vs Claude 3: Which is better?',
        slug: 'chatgpt-vs-claude-3-comparison',
        excerpt: 'We compare the two leading LLMs to help you decide which one is right for you.',
        content: 'Full article content here...',
        category: 'Comparisons',
        readTime: 6,
        publishedAt: '2025-12-28'
    }
]
