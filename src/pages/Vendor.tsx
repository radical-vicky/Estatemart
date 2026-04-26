import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Trash2, 
  Upload, 
  X, 
  Image as ImageIcon, 
  TrendingUp, 
  ShoppingBag, 
  Eye,
  Edit,
  Save,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductRow {
  id: string;
  name: string;
  price: number;
  category: string;
  vendor_name: string;
  image_url: string | null;
  in_stock: boolean;
  description: string | null;
  created_at: string;
}

interface SalesReportDay {
  date: string;
  total: number;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    order_id: string;
  }>;
}

const categories = ["Groceries", "Dairy", "Bakery", "Meat", "Essentials", "Beverages", "Household", "Electronics", "Clothing", "Other"];

const Vendor = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [showReport, setShowReport] = useState(false);
  const [salesReport, setSalesReport] = useState<SalesReportDay[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [vendorName, setVendorName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);
  
  const { toast } = useToast();
  const itemsPerPage = 6;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) setProducts(data);
    setLoading(false);
  };

  const fetchSalesReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }

    setReportLoading(true);
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        product_name,
        quantity,
        price,
        order_id,
        orders!inner (
          created_at,
          status
        )
      `)
      .eq("vendor_id", user.id)
      .eq("orders.status", "paid")
      .order("created_at", { ascending: false, foreignTable: "orders" });

    if (error) {
      console.error("Error fetching sales:", error);
      toast({ title: "Error loading sales report", variant: "destructive" });
    } else if (data) {
      const grouped = (data as any[]).reduce((acc: Record<string, SalesReportDay>, item) => {
        const date = new Date(item.orders.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { date, total: 0, items: [] };
        }
        acc[date].total += item.price;
        acc[date].items.push({
          id: item.id,
          product_name: item.product_name,
          quantity: item.quantity,
          price: item.price,
          order_id: item.order_id,
        });
        return acc;
      }, {});
      setSalesReport(Object.values(grouped));
    }
    setReportLoading(false);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error("Upload error:", error);
      return null;
    } finally {
      setUploadProgress(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !price) {
      toast({ title: "Missing fields", description: "Product name and price are required", variant: "destructive" });
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", variant: "destructive" });
      setSaving(false);
      return;
    }

    let finalImageUrl = imageUrl;
    
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    }

    const { error } = await supabase.from("products").insert({
      name,
      price: parseFloat(price),
      category,
      vendor_name: vendorName || user.email?.split('@')[0] || "EstateMart Vendor",
      image_url: finalImageUrl || null,
      description: description || null,
      vendor_id: user.id,
      in_stock: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product added successfully!" });
      resetForm();
      fetchProducts();
    }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", variant: "destructive" });
      setSaving(false);
      return;
    }

    let finalImageUrl = editingProduct.image_url;
    
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
      }
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    }

    const { error } = await supabase
      .from("products")
      .update({
        name,
        price: parseFloat(price),
        category,
        vendor_name: vendorName || editingProduct.vendor_name,
        image_url: finalImageUrl,
        description: description || null,
      })
      .eq("id", editingProduct.id)
      .eq("vendor_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product updated successfully!" });
      cancelEdit();
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", variant: "destructive" });
      setDeletingId(null);
      return;
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("vendor_id", user.id);

    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Product deleted successfully!" });
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setDeletingId(null);
    setShowDeleteConfirm(null);
  };

  const handleToggleStock = async (id: string, currentStock: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("products")
      .update({ in_stock: !currentStock })
      .eq("id", id)
      .eq("vendor_id", user.id);

    if (!error) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, in_stock: !currentStock } : p)));
      toast({ title: `Product ${!currentStock ? "marked in stock" : "marked out of stock"}` });
    }
  };

  const handleEdit = (product: ProductRow) => {
    setEditingProduct(product);
    setName(product.name);
    setPrice(product.price.toString());
    setCategory(product.category);
    setVendorName(product.vendor_name);
    setImageUrl(product.image_url || "");
    setDescription(product.description || "");
    setImageFile(null);
    setImagePreview(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setCategory("Groceries");
    setVendorName("");
    setImageUrl("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max size 5MB", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageUrl("");
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const openReport = async () => {
    await fetchSalesReport();
    setShowReport(true);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Stats
  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.in_stock).length;
  const totalSales = salesReport.reduce((sum, day) => sum + day.total, 0);
  const totalItemsSold = salesReport.reduce((sum, day) => sum + day.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to store</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="glass" size="sm" onClick={openReport}>
              <TrendingUp className="w-4 h-4 mr-1" /> Sales Report
            </Button>
            <Link to="/vendor/orders">
              <Button variant="glass" size="sm">
                <Eye className="w-4 h-4 mr-1" /> View Orders
              </Button>
            </Link>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Vendor Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your products, track sales, and grow your business</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <Package className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
            <p className="text-xs text-muted-foreground">Total Products</p>
          </div>
          <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <ShoppingBag className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{inStockCount}</p>
            <p className="text-xs text-muted-foreground">In Stock</p>
          </div>
          <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <Package className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalProducts - inStockCount}</p>
            <p className="text-xs text-muted-foreground">Out of Stock</p>
          </div>
          <div className="glass rounded-xl p-4 text-center hover:border-primary/30 transition-all">
            <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-primary">KSh {totalSales.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        <div className="glass rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            {editingProduct ? <Edit className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h2>
          
          <form onSubmit={editingProduct ? handleUpdate : handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Product Name *</label>
                <Input 
                  placeholder="e.g., Fresh Apples" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="bg-secondary/50 border-border" 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price (KSh) *</label>
                <Input 
                  placeholder="e.g., 500" 
                  type="number" 
                  step="0.01"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                  className="bg-secondary/50 border-border" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 rounded-md border border-border bg-secondary/50 px-3 text-sm text-foreground"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Store/Brand Name</label>
                <Input 
                  placeholder="Your store name" 
                  value={vendorName} 
                  onChange={(e) => setVendorName(e.target.value)} 
                  className="bg-secondary/50 border-border" 
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea 
                placeholder="Describe your product..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="bg-secondary/50 border-border"
                rows={3}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Product Image</label>
              
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 cursor-pointer glass rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Upload className="w-4 h-4" />
                  {imageFile ? "Change image" : "Upload image"}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileSelect}
                  />
                </label>
                {imageFile && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={clearImageSelection}
                  >
                    <X className="w-4 h-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
              
              {imagePreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter image URL</span>
                </div>
              </div>
              
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={imageUrl} 
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value) clearImageSelection();
                }} 
                className="bg-secondary/50 border-border"
                disabled={!!imageFile}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="glow" disabled={saving || uploadProgress} className="flex-1">
                {saving || uploadProgress ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {uploadProgress ? "Uploading..." : editingProduct ? "Updating..." : "Adding..."}
                  </span>
                ) : (
                  editingProduct ? <><Save className="w-4 h-4 mr-1" /> Update Product</> : <><Plus className="w-4 h-4 mr-1" /> Add Product</>
                )}
              </Button>
              {editingProduct && (
                <Button type="button" variant="glass" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Products List */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" /> Your Products ({filteredProducts.length})
          </h2>
          
          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48 bg-secondary/50 border-border"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-md border border-border bg-secondary/50 px-3 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">No products yet. Add your first product above.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="glass rounded-xl p-12 text-center">
            <Search className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No products match your search</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((p) => (
                <div key={p.id} className="glass rounded-xl p-4 hover:border-primary/30 transition-all group">
                  <div className="flex gap-4">
                    {p.image_url ? (
                      <img 
                        src={p.image_url} 
                        alt={p.name} 
                        className="w-20 h-20 rounded-lg object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/22c55e/white?text=' + encodeURIComponent(p.name);
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-primary/40" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">KSh {p.price.toLocaleString()} · {p.category}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-border/50">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={p.in_stock ? "text-green-600" : "text-red-600"}
                      onClick={() => handleToggleStock(p.id, p.in_stock)}
                    >
                      {p.in_stock ? "Mark Out" : "Mark In"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    {showDeleteConfirm === p.id ? (
                      <div className="flex gap-1">
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}>
                          {deletingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm"}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setShowDeleteConfirm(p.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sales Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4"
              onClick={() => setShowReport(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            
            <div className="text-center mb-6">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="text-xl font-bold text-foreground">Daily Sales Report</h3>
              <p className="text-xs text-muted-foreground">Your sales performance summary</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">KSh {totalSales.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              <div className="bg-primary/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-primary">{totalItemsSold}</p>
                <p className="text-xs text-muted-foreground">Items Sold</p>
              </div>
            </div>

            {reportLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : salesReport.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">No sales yet</p>
                <p className="text-xs text-muted-foreground">When customers buy your products, sales will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesReport.map((day) => (
                  <div key={day.date} className="border-b border-border pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-foreground">{day.date}</span>
                      <span className="text-primary font-mono font-bold">KSh {day.total.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                      {day.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm pl-2">
                          <span className="text-muted-foreground">
                            {item.product_name} × {item.quantity}
                          </span>
                          <span className="font-mono text-foreground">KSh {item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button variant="glass" className="w-full mt-6" onClick={() => setShowReport(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendor;