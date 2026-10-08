import { useState } from 'react'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReviews() {
  const [reviews] = useState([
    { id: 1, customer: 'John Doe', provider: 'Rajesh Kumar', rating: 5, comment: 'Exceptional work on the AC jet wash! The cooling is back to ice cold and he was extremely polite.', date: '2026-09-28' },
    { id: 2, customer: 'Priya Sharma', provider: 'Amit Singh', rating: 5, comment: 'Prompt arrival within 20 mins. Fixed the kitchen sink blockage quickly without any mess.', date: '2026-09-27' },
    { id: 3, customer: 'Rohan Mehta', provider: 'Rajesh Kumar', rating: 4, comment: 'Good job installing the ceiling fan. Fixed the regulator balance nicely.', date: '2026-09-25' }
  ])

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customer Ratings & Reviews</h1>
        <p className="text-xs sm:text-sm text-gray-500">Moderate platform feedback, ratings authenticity, and provider service quality</p>
      </div>

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-sm">{r.customer}</span>
                <span className="text-xs text-gray-400">reviewed</span>
                <span className="font-bold text-blue-700 text-xs">{r.provider}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} size={13} className="fill-amber-500" />
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl leading-relaxed">
              "{r.comment}"
            </p>

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Posted on {r.date}</span>
              <button
                onClick={() => toast.success('Review flagged for content audit')}
                className="text-gray-500 hover:text-red-600 font-medium"
              >
                Flag Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
