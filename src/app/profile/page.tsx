"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Phone,
  MapPin,
  FileText,
  Save,
  Image as ImageIcon,
  Clock,
  Mail,
  Globe,
  X,
} from "lucide-react";
import { ShopInfo, getShopInfo, saveShopInfo } from "@/lib/shopInfo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Add imports for receipt preview
import { ShopPrintTemplate } from "@/components/helpers/ShopPrintTemplate";
import { Repair } from "@/types/repair";
import { ReceiptTemplate } from "@/components/helpers/ReceiptTemplate";

// Components
const ShopIdentityCard = ({
  shopInfo,
  onShopInfoChange,
  errors,
}: {
  shopInfo: ShopInfo;
  onShopInfoChange: (info: ShopInfo) => void;
  errors: Record<string, string>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match("image.*")) {
        toast.error("Please select an image file (JPEG, PNG, GIF)");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onShopInfoChange({ ...shopInfo, logoUrl: result });
        toast.success("Logo updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onShopInfoChange({ ...shopInfo, logoUrl: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Logo removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Identity</CardTitle>
        <CardDescription>Your shop name and branding</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 rounded-xl w-20 h-20 flex items-center justify-center overflow-hidden">
              {shopInfo.logoUrl ? (
                <img
                  src={shopInfo.logoUrl}
                  alt="Shop Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-blue-600 text-2xl font-bold">
                  {shopInfo.shopName.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Change
              </Button>
              {shopInfo.logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Shop Name *
              </label>
              <Input
                value={shopInfo.shopName}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, shopName: e.target.value })
                }
                className={`mt-1 ${errors.shopName ? "border-red-500" : ""}`}
                placeholder="Enter your shop name"
              />
              {errors.shopName && (
                <p className="text-sm text-red-500 mt-1">{errors.shopName}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Owner Name
              </label>
              <Input
                value={shopInfo.ownerName || ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, ownerName: e.target.value })
                }
                className="mt-1"
                placeholder="Enter the shop owner's name"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="flex items-center gap-3 mt-1">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <Input
                value={shopInfo.email || ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, email: e.target.value })
                }
                placeholder="contact@yourshop.com"
                type="email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Website</label>
            <div className="flex items-center gap-3 mt-1">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <Input
                value={shopInfo.website || ""}
                onChange={(e) =>
                  onShopInfoChange({ ...shopInfo, website: e.target.value })
                }
                placeholder="www.yourshop.com"
                type="url"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ContactInfoCard = ({
  shopInfo,
  onShopInfoChange,
  errors,
}: {
  shopInfo: ShopInfo;
  onShopInfoChange: (info: ShopInfo) => void;
  errors: Record<string, string>;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Contact Information</CardTitle>
      <CardDescription>How customers can reach you</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2.5 rounded-lg">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <Input
              value={shopInfo.phoneNumber}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, phoneNumber: e.target.value })
              }
              className={errors.phoneNumber ? "border-red-500" : ""}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Address *</label>
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-2.5 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <Input
              value={shopInfo.address}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, address: e.target.value })
              }
              className={errors.address ? "border-red-500" : ""}
              placeholder="123 Main St, City, State"
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Business Hours
          </label>
          <div className="flex items-center gap-3 mt-1">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <Input
              value={shopInfo.businessHours || ""}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, businessHours: e.target.value })
              }
              placeholder="Mon-Fri: 9AM-6PM"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ReceiptSettingsCard = ({
  shopInfo,
  onShopInfoChange,
}: {
  shopInfo: ShopInfo;
  onShopInfoChange: (info: ShopInfo) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>Receipt Settings</CardTitle>
      <CardDescription>Customize receipt appearance</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Receipt Footer Text
        </label>
        <div className="flex items-start gap-3">
          <div className="bg-pink-100 p-2.5 rounded-lg">
            <FileText className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1">
            <Textarea
              value={shopInfo.receiptFooter}
              onChange={(e) =>
                onShopInfoChange({ ...shopInfo, receiptFooter: e.target.value })
              }
              rows={4}
              className="text-sm"
              placeholder="Thank you for your business!"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Receipt Preview</h4>
        <div className="bg-white p-3 border rounded text-xs">
          <div className="text-center border-b pb-2 mb-2">
            <div className="font-bold">
              {shopInfo.shopName || "Your Shop Name"}
            </div>
            <div className="text-gray-600">
              {shopInfo.address || "123 Main St, City"}
            </div>
            <div className="text-gray-600">
              Tel: {shopInfo.phoneNumber || "(555) 123-4567"}
            </div>
          </div>
          <div className="text-center text-gray-600">
            {shopInfo.receiptFooter || "Thank you for your business!"}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ProfilePage() {
  const [shopInfo, setShopInfo] = useState<ShopInfo>(getShopInfo());
  const [originalShopInfo, setOriginalShopInfo] = useState<ShopInfo>(
    getShopInfo()
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const receiptPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load shop info from localStorage on component mount
    const info = getShopInfo();
    setShopInfo(info);
    setOriginalShopInfo(info);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!shopInfo.shopName.trim()) {
      newErrors.shopName = "Shop name is required";
    }

    if (!shopInfo.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!shopInfo.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [shopInfo]);

  const handleSaveChanges = () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmSaveChanges = () => {
    setIsSaving(true);
    setShowConfirmDialog(false);

    try {
      // Save shop info to localStorage
      saveShopInfo(shopInfo);

      // Update original state
      setOriginalShopInfo(shopInfo);

      toast.success("Shop information saved successfully!");
    } catch (error) {
      console.error("Error saving shop info:", error);
      toast.error("Failed to save shop information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChanges = () => {
    setShopInfo(originalShopInfo);
    setErrors({});
    toast.info("Changes have been reset");
  };

  const handleShopInfoChange = (newInfo: ShopInfo) => {
    setShopInfo(newInfo);
  };

  const hasChanges =
    JSON.stringify(shopInfo) !== JSON.stringify(originalShopInfo);

  // Sample repair data for preview
  const sampleRepair: Repair = {
    id: "PREVIEW-001",
    customerName: "John Doe",
    customerPhone: "(555) 123-4567",
    deviceBrand: "Apple",
    deviceModel: "iPhone 15 Pro",
    issueDescription: "Screen replacement and battery optimization",
    estimatedCost: 129.99,
    status: "Completed",
    paymentStatus: "Paid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usedParts: [
      {
        id: "1",
        repairId: "PREVIEW-001",
        partName: "OLED Screen",
        cost: 89.99,
        quantity: 1,
      },
      {
        id: "2",
        repairId: "PREVIEW-001",
        partName: "Battery",
        cost: 39.99,
        quantity: 1,
      },
    ],
    payments: [
      {
        id: "1",
        repair_id: "PREVIEW-001",
        amount: 129.99,
        method: "Cash",
        date: new Date().toISOString(),
      },
    ],
    history: [],
    totalPaid: 129.99,
    remainingBalance: 0,
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shop Profile</h1>
          <p className="text-gray-600 mt-2">
            View and manage your shop information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ShopIdentityCard
              shopInfo={shopInfo}
              onShopInfoChange={handleShopInfoChange}
              errors={errors}
            />
            <ContactInfoCard
              shopInfo={shopInfo}
              onShopInfoChange={handleShopInfoChange}
              errors={errors}
            />
            <ReceiptSettingsCard
              shopInfo={shopInfo}
              onShopInfoChange={handleShopInfoChange}
            />
          </div>

          {/* Right Sidebar - Actions */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving || !hasChanges}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResetChanges}
                  disabled={!hasChanges}
                  className="w-full"
                >
                  Reset Changes
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowReceiptPreview(true)}
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Preview Receipt
                </Button>
              </CardContent>
            </Card>

            {/* Inline Receipt Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Receipt Preview
                </CardTitle>
                <CardDescription>
                  Shows current shop logo, contact info, and a sample repair.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md p-3 bg-muted/30 max-h-[420px] overflow-auto">
                  <div className="flex justify-center">
                    <ShopPrintTemplate
                      repair={sampleRepair}
                      includePayments
                      includeParts
                      logoUrl={shopInfo.logoUrl}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasChanges && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-yellow-800">
                    You have unsaved changes. Don't forget to save before
                    leaving!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? This will update your
              shop information across all receipts and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveChanges}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Preview Dialog */}
      {showReceiptPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold">Receipt Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReceiptPreview(false)}
              >
                ✕
              </Button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              <div className="flex justify-center">
                <ReceiptTemplate
                  repair={sampleRepair}
                  includePayments={true}
                  includeParts={true}
                />
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <Button onClick={() => setShowReceiptPreview(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
