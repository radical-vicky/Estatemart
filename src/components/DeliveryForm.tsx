import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Home, Building, Navigation, Save, Plus, User, X, Phone, CheckCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeliveryFormProps {
  onLocationConfirmed: (location: any) => void;
  onClose: () => void;
}

const popularEstates = [
  "Kilimani Estate",
  "Westlands Estate", 
  "Lang'ata Estate",
  "Karen Estate",
  "Parklands Estate",
  "Eastleigh Estate",
  "South B Estate",
  "South C Estate",
  "Buruburu Estate",
  "Umoja Estate",
  "Donholm Estate",
  "Embakasi Estate",
  "Ruiru Estate",
  "Thika Road Estates",
  "Kikuyu Town"
];

const DeliveryForm = ({ onLocationConfirmed, onClose }: DeliveryFormProps) => {
  const [formData, setFormData] = useState({
    resident_name: "",
    estate_name: "",
    house_number: "",
    landmark: "",
    delivery_instructions: "",
  });
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [savingLocation, setSavingLocation] = useState(false);
  const [selectedSavedLocation, setSelectedSavedLocation] = useState<string>("");
  const [otherEstate, setOtherEstate] = useState(false);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
    fetchSavedLocations();
    loadUserProfile();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchSavedLocations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("delivery_locations")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      setSavedLocations(data);
      setShowSavedAddresses(true);
      const defaultLoc = data.find(loc => loc.is_default);
      if (defaultLoc) {
        setSelectedSavedLocation(defaultLoc.id);
        setFormData({
          resident_name: defaultLoc.resident_name,
          estate_name: defaultLoc.estate_name,
          house_number: defaultLoc.house_number || "",
          landmark: defaultLoc.landmark || "",
          delivery_instructions: defaultLoc.delivery_instructions || "",
        });
      }
    }
  };

  const loadUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, phone_number")
        .eq("id", user.id)
        .single();
      
      if (profile?.display_name && !formData.resident_name) {
        setFormData(prev => ({ ...prev, resident_name: profile.display_name }));
      }
    }
  };

  const handleSavedLocationChange = (locationId: string) => {
    setSelectedSavedLocation(locationId);
    const location = savedLocations.find(l => l.id === locationId);
    if (location) {
      setFormData({
        resident_name: location.resident_name,
        estate_name: location.estate_name,
        house_number: location.house_number || "",
        landmark: location.landmark || "",
        delivery_instructions: location.delivery_instructions || "",
      });
    }
  };

  const handleUseSavedLocation = () => {
    if (selectedSavedLocation) {
      const location = savedLocations.find(l => l.id === selectedSavedLocation);
      if (location) {
        onLocationConfirmed({
          resident_name: location.resident_name,
          estate_name: location.estate_name,
          house_number: location.house_number || "",
          landmark: location.landmark || "",
          delivery_instructions: location.delivery_instructions || "",
        });
      }
    }
  };

  const handleDeleteSavedLocation = async (locationId: string) => {
    setDeletingId(locationId);
    const { error } = await supabase
      .from("delivery_locations")
      .delete()
      .eq("id", locationId);

    if (!error) {
      toast({ title: "Address deleted", description: "Saved address has been removed" });
      fetchSavedLocations();
      if (selectedSavedLocation === locationId) {
        setSelectedSavedLocation("");
        setFormData({
          resident_name: "",
          estate_name: "",
          house_number: "",
          landmark: "",
          delivery_instructions: "",
        });
        loadUserProfile();
      }
    } else {
      toast({ title: "Error", description: "Could not delete address", variant: "destructive" });
    }
    setDeletingId(null);
  };

  const handleSetDefault = async (locationId: string) => {
    // First, remove default from all locations
    await supabase
      .from("delivery_locations")
      .update({ is_default: false })
      .eq("user_id", currentUserId);

    // Set new default
    const { error } = await supabase
      .from("delivery_locations")
      .update({ is_default: true })
      .eq("id", locationId);

    if (!error) {
      toast({ title: "Default address set", description: "This will be used as your default delivery address" });
      fetchSavedLocations();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEstateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "other") {
      setOtherEstate(true);
      setFormData({ ...formData, estate_name: "" });
    } else {
      setOtherEstate(false);
      setFormData({ ...formData, estate_name: value });
    }
  };

  const handleSaveLocation = async () => {
    if (!currentUserId) {
      toast({ title: "Please sign in", description: "You need to be logged in to save addresses", variant: "destructive" });
      return;
    }

    if (!formData.resident_name || !formData.estate_name) {
      toast({ title: "Missing fields", description: "Please enter resident name and estate name", variant: "destructive" });
      return;
    }

    setSavingLocation(true);

    const { error } = await supabase.from("delivery_locations").insert({
      user_id: currentUserId,
      resident_name: formData.resident_name,
      estate_name: formData.estate_name,
      house_number: formData.house_number,
      landmark: formData.landmark,
      delivery_instructions: formData.delivery_instructions,
    });

    if (!error) {
      toast({ title: "Address saved!", description: "You can use this address for future orders" });
      fetchSavedLocations();
      setSavingLocation(false);
      // Auto-select the newly saved address
      setTimeout(() => {
        handleUseSavedLocation();
        onClose();
      }, 500);
    } else {
      console.error("Save error:", error);
      toast({ title: "Error", description: error.message || "Could not save address", variant: "destructive" });
      setSavingLocation(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resident_name || !formData.estate_name) {
      toast({ title: "Missing fields", description: "Please enter resident name and estate name", variant: "destructive" });
      return;
    }
    onLocationConfirmed(formData);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Delivery Location</h2>
              <p className="text-xs text-green-100">Where should we deliver your order?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Saved Addresses Section */}
          {showSavedAddresses && savedLocations.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                  📍 Your Saved Addresses
                </label>
                <button
                  type="button"
                  onClick={() => setShowSavedAddresses(false)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Hide
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedSavedLocation === loc.id
                        ? "bg-blue-200 dark:bg-blue-800 border-2 border-blue-500"
                        : "bg-white dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleSavedLocationChange(loc.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{loc.resident_name}</p>
                          {loc.is_default && (
                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">Default</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{loc.estate_name}</p>
                        {loc.house_number && (
                          <p className="text-xs text-gray-500">House: {loc.house_number}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetDefault(loc.id);
                          }}
                          className="p-1 hover:bg-blue-200 dark:hover:bg-gray-600 rounded"
                          title="Set as default"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSavedLocation(loc.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          title="Delete address"
                          disabled={deletingId === loc.id}
                        >
                          {deletingId === loc.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedSavedLocation && (
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={handleUseSavedLocation}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                >
                  <MapPin className="w-4 h-4 mr-1" /> Use Selected Address
                </Button>
              )}
            </div>
          )}

          {!showSavedAddresses && savedLocations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedAddresses(true)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <MapPin className="w-4 h-4" /> Show saved addresses ({savedLocations.length})
            </button>
          )}

          {/* Resident Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              <User className="w-4 h-4 inline mr-1 text-green-600" />
              Resident Name <span className="text-red-500">*</span>
            </label>
            <Input
              name="resident_name"
              value={formData.resident_name}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 w-full"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Full name of the person receiving the order</p>
          </div>

          {/* Estate Name */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              <Building className="w-4 h-4 inline mr-1 text-green-600" />
              Estate / Area Name <span className="text-red-500">*</span>
            </label>
            <select
              name="estate_name"
              value={otherEstate ? "other" : formData.estate_name}
              onChange={handleEstateChange}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select your estate...</option>
              {popularEstates.map((estate) => (
                <option key={estate} value={estate}>{estate}</option>
              ))}
              <option value="other">Other (please specify)</option>
            </select>
            {otherEstate && (
              <Input
                name="estate_name"
                value={formData.estate_name}
                onChange={handleChange}
                placeholder="Enter your estate name"
                className="mt-2 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 w-full"
                required
              />
            )}
            <p className="text-xs text-gray-400 mt-1">Your residential estate or neighborhood</p>
          </div>

          {/* House Number */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              <Home className="w-4 h-4 inline mr-1 text-green-600" />
              House / Apartment Number
            </label>
            <Input
              name="house_number"
              value={formData.house_number}
              onChange={handleChange}
              placeholder="e.g., House 12, Apartment 3B"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Specific house or apartment number for accurate delivery</p>
          </div>

          {/* Landmark */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              <Navigation className="w-4 h-4 inline mr-1 text-green-600" />
              Nearby Landmark
            </label>
            <Input
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              placeholder="e.g., Near the main gate, Opposite Naivas"
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Helps the delivery person find you faster</p>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              <Phone className="w-4 h-4 inline mr-1 text-green-600" />
              Delivery Instructions
            </label>
            <Textarea
              name="delivery_instructions"
              value={formData.delivery_instructions}
              onChange={handleChange}
              placeholder="e.g., Call upon arrival, Gate code: 1234, Ring bell twice"
              rows={3}
              className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 resize-none w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-900 pb-2">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Confirm Delivery Location
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSaveLocation}
              disabled={savingLocation}
              className="w-full border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 py-2.5 rounded-xl font-medium transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {savingLocation ? "Saving..." : "Save Address for Future"}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeliveryForm;