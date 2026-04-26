import { useState, useEffect } from "react";
import { X, Star, Truck, Shield, Clock, CheckCircle, Phone, Mail, Plus, Minus, ShoppingCart, Store, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "./ProductCard";
import Reviews from "./Reviews";

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

const ProductModal = ({ product, isOpen, onClose, onAddToCart }: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [vendorProducts, setVendorProducts] = useState(0);
  const [vendorSales, setVendorSales] = useState(0);
  const [vendorRating, setVendorRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingVendor, setLoadingVendor] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (product?.vendor_id) {
      fetchVendorStats(product.vendor_id);
      fetchVendorRating(product.vendor_id);
    }
    setQuantity(1);
    setActiveImage(0);
  }, [product]);

  const fetchVendorStats = async (vendorId: string) => {
    setLoadingVendor(true);
    
    try {
      const { count: productCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("vendor_id", vendorId);

      setVendorProducts(productCount || 0);

      const { data: salesData } = await supabase
        .from("order_items")
        .select("price")
        .eq("vendor_id", vendorId);

      const totalSales = salesData?.reduce((sum, item) => sum + (item.price || 0), 0) || 0;
      setVendorSales(totalSales);
      
    } catch (err) {
      console.error("Error fetching vendor stats:", err);
    } finally {
      setLoadingVendor(false);
    }
  };

  const fetchVendorRating = async (vendorId: string) => {
    try {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("rating")
        .eq("vendor_id", vendorId);

      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
        setVendorRating(avg);
        setTotalReviews(reviewsData.length);
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("average_rating, total_reviews")
        .eq("id", vendorId)
        .single();

      if (profile) {
        if (profile.average_rating) setVendorRating(profile.average_rating);
        if (profile.total_reviews) setTotalReviews(profile.total_reviews);
      }
      
    } catch (err) {
      console.error("Error fetching vendor rating:", err);
    }
  };

  // FIXED: This function now correctly adds to cart
  const handleAddToCart = () => {
    if (!product) return;
    
    console.log("🟢 ProductModal: Adding to cart", product.name, "quantity:", quantity);
    
    // Call the parent function with product and quantity
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      console.error("🔴 ProductModal: onAddToCart is not defined");
    }
    
    // Close the modal after adding
    onClose();
  };

  const incrementQuantity = () => {
    if (quantity < (product?.inStock ? 99 : 0)) {
      setQuantity(prev => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleRatingUpdate = (rating: number, count: number) => {
    setVendorRating(rating);
    setTotalReviews(count);
  };

  if (!isOpen || !product) return null;

  const images = [product.image, ...(product.additional_images || [])];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200" onClick={onClose}>
        <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/600x600/22c55e/white?text=" + encodeURIComponent(product.name);
                  }}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImage === idx ? "border-green-500" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt={`${product.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  {product.category}
                </span>
                {product.inStock ? (
                  <span className="text-xs font-mono px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    In Stock
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h2>

              {/* Price */}
              <div className="text-3xl font-bold text-green-600 font-mono">
                KSh {product.price.toLocaleString()}
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-10 h-10 rounded-full"
                    onClick={incrementQuantity}
                    disabled={!product.inStock || quantity >= 99}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Add to Cart Button - FIXED */}
              <Button
                className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.inStock ? `Add ${quantity > 1 ? `${quantity}x ` : ""}to Cart` : "Out of Stock"}
              </Button>

              {/* Delivery Info */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Truck className="w-4 h-4 text-green-600" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span>30 min delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Secure M-Pesa</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Information Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800 rounded-b-2xl">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-green-600" />
              About the Vendor
            </h3>

            {loadingVendor ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {product.vendor_name || "EstateMart Vendor"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active Seller
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Selling on EstateMart
                    </p>
                  </div>
                  <div className="text-right">
                    {vendorRating > 0 && (
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                        onClick={() => setShowReviews(true)}
                      >
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-900 dark:text-white">{vendorRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">/5</span>
                        {totalReviews > 0 && (
                          <span className="text-xs text-gray-400 ml-1">({totalReviews} reviews)</span>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">{vendorProducts} {vendorProducts === 1 ? 'product' : 'products'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span>Contact vendor via chat</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowReviews(true)}
                  className="w-full flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700 py-2 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  View all customer reviews ({totalReviews})
                </button>

                <div className="text-xs bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Store Sales:</span>
                    <span className="font-semibold text-green-700 dark:text-green-300">KSh {vendorSales.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-green-200 dark:border-green-800 my-2 pt-2">
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>✓ Verified products</span>
                      <span>✓ Quality guaranteed</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400 mt-1">
                      <span>✓ Fast delivery</span>
                      <span>✓ Secure payments</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {showReviews && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80" onClick={() => setShowReviews(false)}>
          <div className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowReviews(false)}
              className="sticky top-0 float-right m-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="p-6 pt-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pt-2">
                Customer Reviews for {product.vendor_name}
              </h2>
              <Reviews 
                vendorId={product.vendor_id || ''} 
                vendorName={product.vendor_name}
                onRatingUpdate={handleRatingUpdate}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductModal;