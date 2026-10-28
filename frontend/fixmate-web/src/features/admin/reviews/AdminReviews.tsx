import { useState, useEffect } from 'react'
import { Star, RefreshCw, MessageSquare, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/apiClient'

interface ReviewItem {
  id: number
  customer: string
  provider: string
  rating: number
  comment: string
  date: string
  isVisible: boolean
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/reviews')
      if (res.data?.data && Array.isArray(res.data.data)) {
        setReviews(res.data.data)
      }
    } catch (err: any) {
      console.error('Failed to load reviews from database', err)
      toast.error('Failed to fetch reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleToggleVisibility = async (id: number) => {
    try {
      const res = await api.put(`/admin/reviews/${id}/visibility`)
      const nextVisible = res.data?.data
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, isVisible: nextVisible } : r))
      toast.success(nextVisible ? 'Review published to marketplace' : 'Review hidden from marketplace')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update review visibility.')
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Ratings & Reviews</h1>
          <p className="text-xs sm:text-sm text-gray-500">Live platform feedback, verified ratings, and moderation directly from database</p>
        </div>
        <button
          onClick={fetchReviews}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs self-start"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
          <RefreshCw size={18} className="animate-spin text-blue-600" />
          Loading verified reviews from database...
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-500">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-base font-bold text-gray-700">No Reviews Found</p>
          <p className="text-xs text-gray-400 mt-1">Customers have not posted any service reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">{r.customer}</span>
                  <span className="text-xs text-gray-400">reviewed</span>
                  <span className="font-bold text-blue-700 text-xs">{r.provider}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={13} className="fill-amber-500" />
                    ))}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      r.isVisible ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {r.isVisible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed">
                "{r.comment}"
              </p>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Posted on {r.date}</span>
                <button
                  onClick={() => handleToggleVisibility(r.id)}
                  className={`inline-flex items-center gap-1 font-semibold text-xs transition cursor-pointer ${
                    r.isVisible ? 'text-gray-500 hover:text-amber-600' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {r.isVisible ? (
                    <>
                      <EyeOff size={13} /> Hide from Public
                    </>
                  ) : (
                    <>
                      <Eye size={13} /> Restore Visibility
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
