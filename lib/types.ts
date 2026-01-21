export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            activity_logs: {
                Row: {
                    action: string
                    created_at: string | null
                    entity_id: string | null
                    entity_type: string
                    id: string
                    ip_address: string | null
                    new_values: Json | null
                    notes: string | null
                    old_values: Json | null
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type: string
                    id?: string
                    ip_address?: string | null
                    new_values?: Json | null
                    notes?: string | null
                    old_values?: Json | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string | null
                    entity_id?: string | null
                    entity_type?: string
                    id?: string
                    ip_address?: string | null
                    new_values?: Json | null
                    notes?: string | null
                    old_values?: Json | null
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            ad_settings: {
                Row: {
                    placement: string
                    max_slots: number
                    price_per_period: number
                    updated_at: string | null
                }
                Insert: {
                    placement: string
                    max_slots?: number
                    price_per_period?: number
                    updated_at?: string | null
                }
                Update: {
                    placement?: string
                    max_slots?: number
                    price_per_period?: number
                    updated_at?: string | null
                }
                Relationships: []
            }
            ads: {
                Row: {
                    advertiser_email: string | null
                    advertiser_name: string | null
                    clicks: number | null
                    created_at: string | null
                    cta_text: string | null
                    description: string | null
                    ends_at: string | null
                    gradient_from: string | null
                    gradient_to: string | null
                    id: string
                    image_url: string | null
                    impressions: number | null
                    is_active: boolean | null
                    link_url: string
                    name: string
                    placement: string
                    price_paid: number | null
                    starts_at: string | null
                    target_categories: string[] | null
                    title: string | null
                    updated_at: string | null
                }
                Insert: {
                    advertiser_email?: string | null
                    advertiser_name?: string | null
                    clicks?: number | null
                    created_at?: string | null
                    cta_text?: string | null
                    description?: string | null
                    ends_at?: string | null
                    gradient_from?: string | null
                    gradient_to?: string | null
                    id?: string
                    image_url?: string | null
                    impressions?: number | null
                    is_active?: boolean | null
                    link_url: string
                    name: string
                    placement: string
                    price_paid?: number | null
                    starts_at?: string | null
                    target_categories?: string[] | null
                    title?: string | null
                    updated_at?: string | null
                }
                Update: {
                    advertiser_email?: string | null
                    advertiser_name?: string | null
                    clicks?: number | null
                    created_at?: string | null
                    cta_text?: string | null
                    description?: string | null
                    ends_at?: string | null
                    gradient_from?: string | null
                    gradient_to?: string | null
                    id?: string
                    image_url?: string | null
                    impressions?: number | null
                    is_active?: boolean | null
                    link_url?: string
                    name?: string
                    placement?: string
                    price_paid?: number | null
                    starts_at?: string | null
                    target_categories?: string[] | null
                    title?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            blog_posts: {
                Row: {
                    author_avatar: string | null
                    author_id: string | null
                    author_name: string | null
                    category: string
                    content: string
                    cover_image: string | null
                    created_at: string | null
                    excerpt: string
                    id: string
                    published_at: string | null
                    read_time: number | null
                    slug: string
                    status: string | null
                    title: string
                    updated_at: string | null
                    view_count: number | null
                }
                Insert: {
                    author_avatar?: string | null
                    author_id?: string | null
                    author_name?: string | null
                    category: string
                    content: string
                    cover_image?: string | null
                    created_at?: string | null
                    excerpt: string
                    id?: string
                    published_at?: string | null
                    read_time?: number | null
                    slug: string
                    status?: string | null
                    title: string
                    updated_at?: string | null
                    view_count?: number | null
                }
                Update: {
                    author_avatar?: string | null
                    author_id?: string | null
                    author_name?: string | null
                    category?: string
                    content?: string
                    cover_image?: string | null
                    created_at?: string | null
                    excerpt?: string
                    id?: string
                    published_at?: string | null
                    read_time?: number | null
                    slug?: string
                    status?: string | null
                    title?: string
                    updated_at?: string | null
                    view_count?: number | null
                }
                Relationships: []
            }
            categories: {
                Row: {
                    color: string | null
                    created_at: string | null
                    description: string | null
                    icon: string | null
                    id: string
                    name: string
                    slug: string
                    tool_count: number | null
                    updated_at: string | null
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    icon?: string | null
                    id?: string
                    name: string
                    slug: string
                    tool_count?: number | null
                    updated_at?: string | null
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    description?: string | null
                    icon?: string | null
                    id?: string
                    name?: string
                    slug?: string
                    tool_count?: number | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            deals: {
                Row: {
                    affiliate_url: string | null
                    claim_count: number | null
                    code: string | null
                    created_at: string | null
                    description: string
                    discount: string
                    expires_at: string | null
                    id: string
                    is_active: boolean | null
                    starts_at: string | null
                    tool_id: string
                    updated_at: string | null
                }
                Insert: {
                    affiliate_url?: string | null
                    claim_count?: number | null
                    code?: string | null
                    created_at?: string | null
                    description: string
                    discount: string
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    starts_at?: string | null
                    tool_id: string
                    updated_at?: string | null
                }
                Update: {
                    affiliate_url?: string | null
                    claim_count?: number | null
                    code?: string | null
                    created_at?: string | null
                    description?: string
                    discount?: string
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    starts_at?: string | null
                    tool_id?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            favorites: {
                Row: {
                    created_at: string | null
                    tool_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    tool_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    tool_id?: string
                    user_id?: string
                }
                Relationships: []
            }
            newsletter_subscribers: {
                Row: {
                    email: string
                    id: string
                    is_active: boolean | null
                    is_verified: boolean | null
                    name: string | null
                    source: string | null
                    subscribed_at: string | null
                    unsubscribed_at: string | null
                }
                Insert: {
                    email: string
                    id?: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    name?: string | null
                    source?: string | null
                    subscribed_at?: string | null
                    unsubscribed_at?: string | null
                }
                Update: {
                    email?: string
                    id?: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    name?: string | null
                    source?: string | null
                    subscribed_at?: string | null
                    unsubscribed_at?: string | null
                }
                Relationships: []
            }
            review_votes: {
                Row: {
                    created_at: string | null
                    is_helpful: boolean
                    review_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    is_helpful: boolean
                    review_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    is_helpful?: boolean
                    review_id?: string
                    user_id?: string
                }
                Relationships: []
            }
            reviews: {
                Row: {
                    comment: string
                    created_at: string | null
                    guest_email: string | null
                    guest_name: string | null
                    helpful_count: number | null
                    id: string
                    rating: number
                    status: string | null
                    title: string | null
                    tool_id: string
                    updated_at: string | null
                    user_id: string | null
                }
                Insert: {
                    comment: string
                    created_at?: string | null
                    guest_email?: string | null
                    guest_name?: string | null
                    helpful_count?: number | null
                    id?: string
                    rating: number
                    status?: string | null
                    title?: string | null
                    tool_id: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Update: {
                    comment?: string
                    created_at?: string | null
                    guest_email?: string | null
                    guest_name?: string | null
                    helpful_count?: number | null
                    id?: string
                    rating?: number
                    status?: string | null
                    title?: string | null
                    tool_id?: string
                    updated_at?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            submissions: {
                Row: {
                    amount_paid: number | null
                    category_id: string | null
                    created_at: string | null
                    logo_url: string | null
                    name: string
                    payment_id: string | null
                    payment_status: string | null
                    plan: string | null
                    pricing_type: string
                    rejection_reason: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    short_description: string
                    status: string | null
                    submitter_email: string
                    submitter_name: string | null
                    tool_id: string | null
                    updated_at: string | null
                    video_url: string | null
                    website_url: string
                    id: string
                }
                Insert: {
                    amount_paid?: number | null
                    category_id?: string | null
                    created_at?: string | null
                    logo_url?: string | null
                    name: string
                    payment_id?: string | null
                    payment_status?: string | null
                    plan?: string | null
                    pricing_type: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    short_description: string
                    status?: string | null
                    submitter_email: string
                    submitter_name?: string | null
                    tool_id?: string | null
                    updated_at?: string | null
                    video_url?: string | null
                    website_url: string
                    id?: string
                }
                Update: {
                    amount_paid?: number | null
                    category_id?: string | null
                    created_at?: string | null
                    logo_url?: string | null
                    name?: string
                    payment_id?: string | null
                    payment_status?: string | null
                    plan?: string | null
                    pricing_type?: string
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    short_description?: string
                    status?: string | null
                    submitter_email?: string
                    submitter_name?: string | null
                    tool_id?: string | null
                    updated_at?: string | null
                    video_url?: string | null
                    website_url?: string
                    id?: string
                }
                Relationships: []
            }
            tags: {
                Row: {
                    created_at: string | null
                    id: string
                    name: string
                    slug: string
                    usage_count: number | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    name: string
                    slug: string
                    usage_count?: number | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    name?: string
                    slug?: string
                    usage_count?: number | null
                }
                Relationships: []
            }
            tool_features: {
                Row: {
                    created_at: string | null
                    feature: string
                    id: string
                    sort_order: number | null
                    tool_id: string
                }
                Insert: {
                    created_at?: string | null
                    feature: string
                    id?: string
                    sort_order?: number | null
                    tool_id: string
                }
                Update: {
                    created_at?: string | null
                    feature?: string
                    id?: string
                    sort_order?: number | null
                    tool_id?: string
                }
                Relationships: []
            }
            tool_tags: {
                Row: {
                    tag_id: string
                    tool_id: string
                }
                Insert: {
                    tag_id: string
                    tool_id: string
                }
                Update: {
                    tag_id?: string
                    tool_id?: string
                }
                Relationships: []
            }
            tool_views: {
                Row: {
                    created_at: string | null
                    id: string
                    ip_hash: string | null
                    referrer: string | null
                    tool_id: string
                    user_agent: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    ip_hash?: string | null
                    referrer?: string | null
                    tool_id: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    ip_hash?: string | null
                    referrer?: string | null
                    tool_id?: string
                    user_agent?: string | null
                    user_id?: string | null
                }
                Relationships: []
            }
            tools: {
                Row: {
                    category_id: string | null
                    created_at: string | null
                    favorite_count: number | null
                    has_api: boolean | null
                    has_backlink: boolean | null
                    has_free_trial: boolean | null
                    has_premium_support: boolean | null
                    id: string
                    image_url: string | null
                    is_open_source: boolean | null
                    is_priority: boolean | null
                    is_verified: boolean | null
                    logo_url: string | null
                    dominant_color: string | null
                    long_description: string | null
                    name: string
                    owner_id: string | null
                    plan: string | null
                    pricing_type: string | null
                    rating: number | null
                    rejection_reason: string | null
                    review_count: number | null
                    short_description: string
                    slug: string
                    status: string | null
                    submitted_by: string | null
                    submitted_email: string | null
                    subscription_ends_at: string | null
                    subscription_starts_at: string | null
                    updated_at: string | null
                    video_url: string | null
                    view_count: number | null
                    website_url: string
                }
                Insert: {
                    category_id?: string | null
                    created_at?: string | null
                    favorite_count?: number | null
                    has_api?: boolean | null
                    has_backlink?: boolean | null
                    has_free_trial?: boolean | null
                    has_premium_support?: boolean | null
                    id?: string
                    image_url?: string | null
                    is_open_source?: boolean | null
                    is_priority?: boolean | null
                    is_verified?: boolean | null
                    logo_url?: string | null
                    dominant_color?: string | null
                    long_description?: string | null
                    name: string
                    plan?: string | null
                    pricing_type?: string | null
                    rating?: number | null
                    rejection_reason?: string | null
                    review_count?: number | null
                    short_description: string
                    slug: string
                    status?: string | null
                    submitted_by?: string | null
                    submitted_email?: string | null
                    subscription_ends_at?: string | null
                    subscription_starts_at?: string | null
                    updated_at?: string | null
                    video_url?: string | null
                    view_count?: number | null
                    website_url: string
                }
                Update: {
                    category_id?: string | null
                    created_at?: string | null
                    favorite_count?: number | null
                    has_api?: boolean | null
                    has_backlink?: boolean | null
                    has_free_trial?: boolean | null
                    has_premium_support?: boolean | null
                    id?: string
                    image_url?: string | null
                    is_open_source?: boolean | null
                    is_priority?: boolean | null
                    is_verified?: boolean | null
                    logo_url?: string | null
                    dominant_color?: string | null
                    long_description?: string | null
                    name?: string
                    plan?: string | null
                    pricing_type?: string | null
                    rating?: number | null
                    rejection_reason?: string | null
                    review_count?: number | null
                    short_description?: string
                    slug?: string
                    status?: string | null
                    submitted_by?: string | null
                    submitted_email?: string | null
                    subscription_ends_at?: string | null
                    subscription_starts_at?: string | null
                    updated_at?: string | null
                    video_url?: string | null
                    view_count?: number | null
                    website_url?: string
                }
                Relationships: []
            }
            users: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    email: string
                    id: string
                    name: string
                    role: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email: string
                    id?: string
                    name: string
                    role?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    email?: string
                    id?: string
                    name?: string
                    role?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            subscriptions: {
                Row: {
                    id: string
                    user_id: string | null
                    plan: 'free' | 'pro' | 'featured' | 'sponsor'
                    status: 'active' | 'cancelled' | 'expired' | 'pending'
                    starts_at: string | null
                    ends_at: string | null
                    payment_id: string | null
                    payment_method: string | null
                    amount: number | null
                    currency: string | null
                    auto_renew: boolean | null
                    metadata: Json | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    plan?: 'free' | 'pro' | 'featured' | 'sponsor'
                    status?: 'active' | 'cancelled' | 'expired' | 'pending'
                    starts_at?: string | null
                    ends_at?: string | null
                    payment_id?: string | null
                    payment_method?: string | null
                    amount?: number | null
                    currency?: string | null
                    auto_renew?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    plan?: 'free' | 'pro' | 'featured' | 'sponsor'
                    status?: 'active' | 'cancelled' | 'expired' | 'pending'
                    starts_at?: string | null
                    ends_at?: string | null
                    payment_id?: string | null
                    payment_method?: string | null
                    amount?: number | null
                    currency?: string | null
                    auto_renew?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            tool_claims: {
                Row: {
                    id: string
                    tool_id: string | null
                    user_id: string | null
                    status: 'pending' | 'approved' | 'rejected'
                    verification_method: 'dns' | 'meta_tag' | 'email' | 'manual' | null
                    verification_data: Json | null
                    rejection_reason: string | null
                    reviewed_at: string | null
                    reviewed_by: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    tool_id?: string | null
                    user_id?: string | null
                    status?: 'pending' | 'approved' | 'rejected'
                    verification_method?: 'dns' | 'meta_tag' | 'email' | 'manual' | null
                    verification_data?: Json | null
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    tool_id?: string | null
                    user_id?: string | null
                    status?: 'pending' | 'approved' | 'rejected'
                    verification_method?: 'dns' | 'meta_tag' | 'email' | 'manual' | null
                    verification_data?: Json | null
                    rejection_reason?: string | null
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            anonymous_favorites: {
                Row: {
                    id: string
                    tool_id: string
                    anon_id: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    tool_id: string
                    anon_id: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    tool_id?: string
                    anon_id?: string
                    created_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Entity aliases
export type Tool = Tables<'tools'>
export type Category = Tables<'categories'>
export type Tag = Tables<'tags'>
export type Review = Tables<'reviews'>
export type Deal = Tables<'deals'>
export type BlogPost = Tables<'blog_posts'>
export type User = Tables<'users'>
export type Submission = Tables<'submissions'>
export type NewsletterSubscriber = Tables<'newsletter_subscribers'>
export type Ad = Tables<'ads'>
export type ToolFeature = Tables<'tool_features'>
export type ToolView = Tables<'tool_views'>
export type Subscription = Tables<'subscriptions'>
export type ToolClaim = Tables<'tool_claims'>
export type AdSetting = Tables<'ad_settings'>

// Plan types
export type SubscriptionPlan = 'free' | 'pro' | 'featured' | 'sponsor'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'pending'
export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type VerificationMethod = 'dns' | 'meta_tag' | 'email' | 'manual'

// Extended types for frontend use
export interface ToolWithRelations extends Tool {
    category?: Category | null
    tags?: Tag[]
    features?: ToolFeature[]
    owner?: User | null
    reviews?: Review[]
}

export interface ReviewWithUser extends Review {
    users?: User | null
}

export interface SubscriptionWithUser extends Subscription {
    users?: User | null
}

export interface ToolClaimWithRelations extends ToolClaim {
    tools?: Tool | null
    users?: User | null
    reviewer?: User | null
}

