import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchProducts,
  fetchCategories,
  setSelectedCategory,
  setSort,
  setPage,
  resetFilters,
} from '../store/productSlice';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import { Filter, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function Home() {
  const dispatch = useDispatch();
  const {
    products,
    categories,
    selectedCategory,
    searchQuery,
    sortBy,
    sortDir,
    page,
    totalPages,
    totalElements,
    loading,
  } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch, selectedCategory, searchQuery, sortBy, sortDir, page]);

  const handleCategoryClick = (catId) => {
    dispatch(setSelectedCategory(selectedCategory === catId ? null : catId));
  };

  const handleSortChange = (e) => {
    const [by, dir] = e.target.value.split(':');
    dispatch(setSort({ sortBy: by, sortDir: dir }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-8 md:p-12 shadow-xl shadow-blue-950/10">
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Next-Gen E-Commerce</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Discover Premium Products at ShopEase
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Shop the latest tech gadgets, fashion trends, and home essentials with seamless Razorpay payments and fast delivery.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 hidden lg:block bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          <button
            onClick={() => dispatch(setSelectedCategory(null))}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sorting & Reset */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <select
              value={`${sortBy}:${sortDir}`}
              onChange={handleSortChange}
              className="bg-gray-100 border border-transparent text-gray-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-blue-500"
            >
              <option value="id:asc">Featured</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="name:asc">Name: A to Z</option>
            </select>
          </div>

          {(selectedCategory !== null || searchQuery !== '') && (
            <button
              onClick={() => dispatch(resetFilters())}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-xl transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Search/Filter Banner */}
      {searchQuery && (
        <div className="text-sm text-gray-600 flex items-center justify-between">
          <span>
            Search results for "<strong className="text-gray-900">{searchQuery}</strong>" ({totalElements} items)
          </span>
          <button
            onClick={() => dispatch(resetFilters())}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse space-y-4">
              <div className="aspect-[4/3] bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 bg-gray-200 rounded w-1/3" />
                <div className="h-8 bg-gray-200 rounded-xl w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => dispatch(setPage(p))}
          />
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-md mx-auto space-y-4">
          <Filter className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No Products Found</h3>
          <p className="text-xs text-gray-500">
            Try adjusting your search criteria or category filter to find what you're looking for.
          </p>
          <button
            onClick={() => dispatch(resetFilters())}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
