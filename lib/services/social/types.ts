export interface SocialToolPayload {
    id: string
    name: string
    slug: string
    short_description: string
    long_description?: string
    website_url: string
    logo_url?: string
    pricing_type: string
    plan?: string
    category_name?: string
    tags?: string[]
    is_verified?: boolean
}

export interface SocialPostResult {
    adapterId: string
    adapterName: string
    success: boolean
    error?: string
}

export interface SocialAdapter {
    id: string
    name: string
    isEnabled(): boolean
    post(tool: SocialToolPayload): Promise<{ success: boolean; error?: string }>
}
