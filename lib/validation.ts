// Form validation schemas using Zod
import { z } from 'zod';

// Game management
export const GameFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  longDescription: z.string().optional(),
  coverImage: z.string().url('Must be a valid URL').optional(),
  bannerImage: z.string().url('Must be a valid URL').optional(),
  developer: z.string().min(1, 'Developer is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  releaseDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  price: z.number().min(0, 'Price must be non-negative').max(999.99),
  discountPercent: z.number().min(0).max(100),
  platforms: z.array(z.string()).min(1, 'Select at least one platform'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
  isAvailable: z.boolean().default(true),
});

export type GameFormInput = z.infer<typeof GameFormSchema>;

// User profile
export const ProfileFormSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url('Must be a valid URL').optional(),
});

export type ProfileFormInput = z.infer<typeof ProfileFormSchema>;

// Review
export const ReviewFormSchema = z.object({
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  content: z.string().min(20, 'Review must be at least 20 characters').max(5000),
});

export type ReviewFormInput = z.infer<typeof ReviewFormSchema>;

// Address
export const AddressFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  streetAddress: z.string().min(1, 'Address is required').max(100),
  streetAddress2: z.string().optional(),
  city: z.string().min(1, 'City is required').max(50),
  stateProvince: z.string().min(1, 'State/Province is required').max(50),
  postalCode: z.string().min(1, 'Postal code is required').max(20),
  country: z.string().min(1, 'Country is required').max(50),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
  type: z.enum(['billing', 'shipping']).default('billing'),
});

export type AddressFormInput = z.infer<typeof AddressFormSchema>;

// Checkout
export const CheckoutFormSchema = z.object({
  email: z.string().email('Invalid email'),
  billingAddress: AddressFormSchema,
  shippingAddress: AddressFormSchema.optional(),
  sameAsShipping: z.boolean().optional(),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  agreeToTerms: z.boolean().refine((val) => val === true, 'You must agree to the terms'),
});

export type CheckoutFormInput = z.infer<typeof CheckoutFormSchema>;

// Featured games (admin)
export const FeaturedGameFormSchema = z.object({
  gameId: z.string().uuid('Invalid game ID'),
  placement: z.enum(['hero', 'trending', 'new_release', 'on_sale', 'recommended']),
  sortOrder: z.number().int().min(0),
  active: z.boolean().default(true),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
});

export type FeaturedGameFormInput = z.infer<typeof FeaturedGameFormSchema>;

// Search filters
export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  categories: z.array(z.string()).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  sortBy: z.enum(['featured', 'newest', 'rating', 'price-low', 'price-high']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;

// Helper to get error message from Zod error
export function getErrorMessage(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  if (firstIssue) {
    return `${firstIssue.path.join('.')}: ${firstIssue.message}`;
  }
  return 'An error occurred';
}
