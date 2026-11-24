export type Condition = 'brand_new' | 'certified_refurbished' | 'pre_owned_excellent' | 'pre_owned_fair'
export type Category = 'phones' | 'laptops' | 'audio' | 'tablets' | 'cameras' | 'books' | 'fashion' | 'home' | 'other'
export type ListingStatus = 'active' | 'reserved' | 'sold'
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired' | 'completed'

export type User = {
  id: string
  name: string
  email?: string
  campus: string
  department: string | null
  avatarUrl: string | null
  verified: boolean
  rating: number
  tradesCount: number
  responseTime: string
}

export type Hub = {
  id: string
  name: string
  area: string
  description: string
  features: string[]
}

export type ListingChecks = {
  batteryHealth?: number
  functionalTested?: boolean
  originalBox?: boolean
  proofOfPurchase?: boolean
  serialVerified?: boolean
}

export type Listing = {
  id: string
  sellerId: string
  hubId: string | null
  title: string
  description: string
  category: Category
  condition: Condition
  grade: string | null
  price: number
  originalPrice: number | null
  negotiable: boolean
  images: string[]
  tags: string[]
  checks: ListingChecks
  warrantyMonths: number
  location: string
  inspected: boolean
  status: ListingStatus
  views: number
  createdAt: string
  seller?: User
  hub?: Hub | null
  isFavorite?: boolean
}

export type Paginated<T> = { items: T[]; total: number; page: number; pageSize: number }

export type Offer = {
  id: string
  conversationId: string
  listingId: string
  buyerId: string
  hubId: string | null
  amount: number
  note: string
  status: OfferStatus
  meetupAt: string | null
  expiresAt: string
  createdAt: string
  verificationPin?: string
  hub?: Hub | null
}

export type Message = {
  id: string
  conversationId: string
  senderId: string | null
  offerId: string | null
  type: 'text' | 'offer' | 'system'
  body: string
  imageUrl: string | null
  readAt: string | null
  createdAt: string
  offer?: Offer | null
}

export type ConversationSummary = {
  id: string
  role: 'buyer' | 'seller'
  listing: Pick<Listing, 'id' | 'title' | 'price' | 'images' | 'condition' | 'grade' | 'status' | 'sellerId'>
  otherUser: User
  lastMessage: { body: string; type: Message['type']; senderId: string | null; createdAt: string } | null
  unreadCount: number
  lastMessageAt: string
}

export type Conversation = {
  id: string
  listingId: string
  buyerId: string
  sellerId: string
  role: 'buyer' | 'seller'
  listing: Listing
  buyer: User
  seller: User
  otherUser: User
}

export type Assessment = {
  legitimacyScore: number
  certifiable: boolean
  notes: string[]
  suggestedPrice: { low: number; high: number; recommended: number } | null
}
