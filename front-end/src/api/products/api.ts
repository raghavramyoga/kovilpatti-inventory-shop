import { apiClient } from '../client'
import type {
  ProductDto, CreateProductRequest, UpdateProductRequest, ProductListFilters,
} from './types'

function toQueryString(filters?: ProductListFilters): string {
  if (!filters) return ''
  const params = new URLSearchParams()
  if (filters.search)              params.set('search', filters.search)
  if (filters.categoryId != null)  params.set('categoryId', String(filters.categoryId))
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const productsApi = {
  list:   (filters?: ProductListFilters)            => apiClient.get<ProductDto[]>(`/api/products${toQueryString(filters)}`),
  get:    (id: string)                              => apiClient.get<ProductDto>(`/api/products/${id}`),
  create: (req: CreateProductRequest)               => apiClient.post<ProductDto>('/api/products', req),
  update: (id: string, req: UpdateProductRequest)   => apiClient.put<ProductDto>(`/api/products/${id}`, req),
  remove: (id: string)                              => apiClient.delete<void>(`/api/products/${id}`),
}
