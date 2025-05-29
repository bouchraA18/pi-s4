import React, { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import axios from "axios";

const Stars = ({ value = 0, size = 18 }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= value ? "text-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );
};

export default function ReviewSection({ etabId }) {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    axios.get(`/api/etablissement/${etabId}/`).then((res) => {
      setReviews(res.data.avis || []);
    });
  }, [etabId]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!rating || !name.trim() || !email.trim() || !comment.trim()) return;
    setPosting(true);
    try {
      await axios.post(`/api/etablissement/${etabId}/avis/`, {
        utilisateur: name,
        email,
        note: rating,
        commentaire: comment,
      });
      const updated = await axios.get(`/api/etablissement/${etabId}/`);
      setReviews(updated.data.avis || []);
      setName("");
      setEmail("");
      setComment("");
      setRating(0);
    } finally {
      setPosting(false);
    }
  };

  const average = reviews.length
    ? (reviews.reduce((s, r) => s + (r.note || 0), 0) / reviews.length).toFixed(1)
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((n) => ({
    score: n,
    count: reviews.filter((r) => r.note === n).length,
  }));

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-3 gap-10">
        <div className="col-span-1 space-y-6">
          <div className="text-center bg-yellow-50 rounded p-4">
            <p className="text-3xl font-bold text-yellow-600">{average}</p>
            <Stars value={Math.round(average)} />
            <p className="text-sm text-gray-500 mt-1">{reviews.length} Avis</p>
          </div>
          <div className="space-y-2">
            {ratingCounts.map(({ score, count }) => {
              const percent = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-2">
                  <p className="w-12 text-sm">{score} ⭐</p>
                  <div className="w-full bg-gray-200 rounded h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="col-span-2 space-y-10">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Recent Feedbacks</h3>
            {reviews.map((r, i) => (
              <div key={i} className="flex gap-4 border-b pb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{r.utilisateur || "Utilisateur"}</p>
                  <Stars value={r.note} size={16} />
                  <p className="text-sm text-gray-600 mt-1">{r.commentaire}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={submitReview} className="space-y-4">
            <h3 className="text-xl font-semibold">Add a Review</h3>
            <div>
              <p className="text-sm font-medium mb-1">Add Your Rating *</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                  >
                    <Star
                      size={30}
                      className={(hover || rating) >= s ? "text-yellow-400" : "text-gray-300"}
                    />
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Name *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <textarea
              placeholder="Write your review *"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={posting}
              className="bg-yellow-400 hover:bg-yellow-500 text-white font-medium px-6 py-2 rounded"
            >
              {posting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
