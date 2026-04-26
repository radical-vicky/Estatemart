import { useState, useEffect } from "react";
import { Star, User, Calendar, CheckCircle, ThumbsUp, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string;
  user_id: string;
  user_name: string;
  created_at: string;
  is_verified_purchase: boolean;
  helpful_count: number;
}

interface ReviewsProps {
  vendorId: string;
  vendorName: string;
  onRatingUpdate?: (rating: number, count: number) => void;
}

const Reviews = ({ vendorId, vendorName, onRatingUpdate }: ReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
    checkUserReview();
    getCurrentUser();
  }, [vendorId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchReviews = async () => {
    setLoading(true);
    
    const { data: reviewsData, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles:user_id (display_name, email)
      `)
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
    } else if (reviewsData) {
      const reviewsWithHelpful = reviewsData.map((review) => ({
        ...review,
        user_name: review.profiles?.display_name || review.profiles?.email?.split('@')[0] || "Anonymous",
        helpful_count: 0,
      }));
      
      setReviews(reviewsWithHelpful);
      
      if (onRatingUpdate && reviewsWithHelpful.length > 0) {
        const avg = reviewsWithHelpful.reduce((sum, r) => sum + r.rating, 0) / reviewsWithHelpful.length;
        onRatingUpdate(avg, reviewsWithHelpful.length);
      }
    }
    
    setLoading(false);
  };

  const checkUserReview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reviews")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setHasReviewed(true);
    }
  };

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast({ title: "Please sign in", description: "You need to be logged in to leave a review", variant: "destructive" });
      return;
    }

    if (userRating === 0) {
      toast({ title: "Select a rating", description: "Please select a star rating before submitting", variant: "destructive" });
      return;
    }

    if (!userComment.trim()) {
      toast({ title: "Write a review", description: "Please share your experience with this vendor", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Check if user has purchased from this vendor
    const { data: orders } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("vendor_id", vendorId)
      .limit(1);

    const isVerifiedPurchase = orders && orders.length > 0;

    const { error } = await supabase.from("reviews").insert({
      vendor_id: vendorId,
      user_id: currentUser.id,
      rating: userRating,
      comment: userComment,
      is_verified_purchase: isVerifiedPurchase,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!", description: "Thank you for your feedback" });
      setUserRating(0);
      setUserComment("");
      setHasReviewed(true);
      fetchReviews();
    }
    
    setSubmitting(false);
  };

  const renderStars = (rating: number, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && setUserRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`focus:outline-none ${interactive ? 'transition-transform hover:scale-110' : ''}`}
          disabled={!interactive}
          type="button"
        >
          <Star
            className={`w-5 h-5 ${
              i <= (interactive ? (hoverRating || userRating) : rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Write Review Section */}
      {!hasReviewed && currentUser && (
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Write a Review</h4>
          <div className="space-y-3">
            <div className="flex gap-1">{renderStars(0, true)}</div>
            <Textarea
              placeholder="Share your experience with this vendor..."
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              rows={3}
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      )}

      {!currentUser && (
        <div className="text-center py-4 text-gray-500">
          <p>Please sign in to leave a review</p>
        </div>
      )}

      {hasReviewed && (
        <div className="text-center py-2 text-green-600 text-sm">
          ✓ You have already reviewed this vendor
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to review this vendor!
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {review.user_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(review.created_at), "MMM d, yyyy")}</span>
                      {review.is_verified_purchase && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" /> Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex">{renderStars(review.rating)}</div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm ml-10">
                {review.comment}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;