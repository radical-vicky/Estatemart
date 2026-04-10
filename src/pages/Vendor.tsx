import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Package, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
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
}

const Vendor = () => {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const categories = ["Groceries", "Dairy", "Bakery", "Meat", "Essentials", "Beverages", "Household"];

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

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadProgress(true);
      
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({ 
          title: "Upload failed", 
          description: uploadError.message, 
          variant: "destructive" 
        });
        return null;
      }
      
      // Get the public URL
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
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Not signed in", variant: "destructive" });
      setSaving(false);
      return;
    }

    let finalImageUrl = imageUrl;
    
    // Upload image first if selected
    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (uploadedUrl) {
        finalImageUrl = uploadedUrl;
        toast({ title: "Image uploaded!", description: "Adding product..." });
      }
    }

    const { error } = await supabase.from("products").insert({
      name,
      price: parseFloat(price),
      category,
      vendor_name: vendorName || "EstateMart",
      image_url: finalImageUrl || null,
      description: description || null,
      vendor_id: user.id,
      in_stock: true,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Product added successfully!" });
      // Clear form
      setName("");
      setPrice("");
      setCategory("Groceries");
      setVendorName("");
      setImageUrl("");
      setDescription("");
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Product deleted" });
    }
  };

  const handleToggleStock = async (id: string, currentStock: boolean) => {
    await supabase.from("products").update({ in_stock: !currentStock }).eq("id", id);
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, in_stock: !currentStock } : p)));
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
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Clear URL input if file is selected
      setImageUrl("");
    }
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to store</span>
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-1">Vendor Dashboard</h1>
        <p className="text-muted-foreground text-sm mb-8">Add and manage your products</p>

        {/* Add Product Form */}
        <form onSubmit={handleAdd} className="glass rounded-xl p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add New Product
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Input 
              placeholder="Product name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="bg-secondary/50 border-border" 
            />
            <Input 
              placeholder="Price (KSh)" 
              type="number" 
              step="0.01"
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              required 
              className="bg-secondary/50 border-border" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 rounded-md border border-border bg-secondary/50 px-3 text-sm text-foreground"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Input 
              placeholder="Vendor name" 
              value={vendorName} 
              onChange={(e) => setVendorName(e.target.value)} 
              className="bg-secondary/50 border-border" 
            />
          </div>
          
          <Textarea 
            placeholder="Description (optional)" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="bg-secondary/50 border-border"
            rows={3}
          />
          
          {/* Image Upload Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Product Image</label>
            
            {/* File Upload */}
            <div className="flex items-center gap-3">
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
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            
            {/* OR Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter image URL</span>
              </div>
            </div>
            
            {/* URL Input */}
            <Input 
              placeholder="Image URL (optional)" 
              value={imageUrl} 
              onChange={(e) => {
                setImageUrl(e.target.value);
                if (e.target.value) clearImageSelection();
              }} 
              className="bg-secondary/50 border-border"
              disabled={!!imageFile}
            />
          </div>
          
          <Button variant="glow" className="w-full" disabled={saving || uploadProgress}>
            {saving || uploadProgress ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {uploadProgress ? "Uploading image..." : "Adding product..."}
              </span>
            ) : (
              "Add Product"
            )}
          </Button>
        </form>

        {/* Product List */}
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Package className="w-4 h-4 text-primary" /> Your Products ({products.length})
        </h2>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : products.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm">No products yet. Add your first product above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="glass rounded-xl p-4 flex items-center gap-4">
                {p.image_url && (
                  <img 
                    src={p.image_url} 
                    alt={p.name} 
                    className="w-14 h-14 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/22c55e/white?text=' + encodeURIComponent(p.name);
                    }}
                  />
                )}
                {!p.image_url && (
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-primary/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">KSh {p.price} · {p.category}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={p.in_stock ? "text-primary" : "text-destructive"}
                  onClick={() => handleToggleStock(p.id, p.in_stock)}
                >
                  {p.in_stock ? "In Stock" : "Out"}
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Vendor;