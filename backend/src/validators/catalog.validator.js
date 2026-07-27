import { z } from 'zod'

export const productListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(24),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    tag: z.string().optional(),
    q: z.string().optional(),
    brand: z.union([z.string(), z.array(z.string())]).optional(),
    color: z.union([z.string(), z.array(z.string())]).optional(),
    size: z.union([z.string(), z.array(z.string())]).optional(),
    maxPrice: z.coerce.number().optional(),
    featured: z.coerce.boolean().optional(),
    sort: z.enum(['newest', 'price-asc', 'price-desc', 'discount', 'rating']).default('newest')
  })
})

export const stockNotifySchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    email: z.string().email(),
    size: z.string().optional(),
    color: z.string().optional()
  })
})

export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email(),
    source: z.string().optional()
  })
})
