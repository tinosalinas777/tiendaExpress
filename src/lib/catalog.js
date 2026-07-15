import { supabase, isSupabaseConfigured } from './supabaseClient'
import { mockCategories, mockProducts } from '../data/mockData'

export async function fetchCategories() {
  if (!isSupabaseConfigured) return mockCategories
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error || !data || data.length === 0) return mockCategories
  return data
}

export async function fetchProducts({ categoryId, search } = {}) {
  if (!isSupabaseConfigured) {
    return filterMock(mockProducts, { categoryId, search })
  }
  let query = supabase.from('products').select('*').eq('active', true)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query.order('name')
  if (error || !data) return filterMock(mockProducts, { categoryId, search })
  return data
}

export async function fetchProductById(id) {
  if (!isSupabaseConfigured) {
    return mockProducts.find((p) => String(p.id) === String(id)) || null
  }
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error || !data) return mockProducts.find((p) => String(p.id) === String(id)) || null
  return data
}

function filterMock(list, { categoryId, search }) {
  let result = list
  if (categoryId) result = result.filter((p) => p.category_id === categoryId)
  if (search) {
    const s = search.toLowerCase()
    result = result.filter((p) => p.name.toLowerCase().includes(s))
  }
  return result
}
