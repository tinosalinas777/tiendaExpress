import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { mockCategories, mockProducts } from "../data/mockData";

export async function fetchCategories() {
  if (!isSupabaseConfigured) return mockCategories;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error || !data || data.length === 0) return mockCategories;
  return data;
}
export async function fetchProducts({ categoryId, search, onOffer } = {}) {
  if (!isSupabaseConfigured) {
    return filterMock(mockProducts, { categoryId, search, onOffer });
  }
  let query = supabase.from("products").select("*").eq("active", true);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (search) query = query.ilike("name", `%${search}%`);
  if (onOffer) query = query.not("badge", "is", null);
  const { data, error } = await query.order("name");
  if (error || !data)
    return filterMock(mockProducts, { categoryId, search, onOffer });
  return data;
}

export async function fetchProductById(id) {
  if (!isSupabaseConfigured) {
    return mockProducts.find((p) => String(p.id) === String(id)) || null;
  }
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data)
    return mockProducts.find((p) => String(p.id) === String(id)) || null;
  return data;
}

export async function fetchProductReviews(productId) {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data;
}

export async function submitProductReview({
  productId,
  customerName,
  rating,
  comment,
}) {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase no está conectado todavía, no se puede guardar la reseña.",
    );
  }
  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    customer_name: customerName,
    rating,
    comment: comment || null,
  });
  if (error) throw error;
}

function filterMock(list, { categoryId, search, onOffer }) {
  let result = list;
  if (categoryId) result = result.filter((p) => p.category_id === categoryId);
  if (onOffer) result = result.filter((p) => !!p.badge);
  if (search) {
    const s = search.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(s));
  }
  return result;
}
