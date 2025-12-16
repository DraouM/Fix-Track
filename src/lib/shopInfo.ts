// lib/shopInfo.ts
// Shop information management

export interface ShopInfo {
  shopName: string;
  phoneNumber: string;
  address: string;
  receiptFooter: string;
  email?: string;
  website?: string;
  businessHours?: string;
  logoUrl?: string; // Add logo URL field
  ownerName?: string; // Add owner name field
}

// Default shop information (same as in profile page)
export const DEFAULT_SHOP_INFO: ShopInfo = {
  shopName: "TechFix Pro",
  phoneNumber: "+1 (555) 123-4567",
  address: "123 Repair Street, Tech City, TC",
  receiptFooter:
    "Thank you for your business!\nWarranty applies to parts and labor.",
  email: "contact@techfixpro.com",
  website: "www.techfixpro.com",
  businessHours: "Mon-Fri: 9AM-6PM, Sat: 10AM-4PM",
  logoUrl: "", // Default to empty string
  ownerName: "John Smith", // Default owner name
};

// Function to get shop info from localStorage or return defaults
export const getShopInfo = (): ShopInfo => {
  if (typeof window !== "undefined") {
    const shopInfoRaw = localStorage.getItem("shopInfo");
    if (shopInfoRaw) {
      try {
        return { ...DEFAULT_SHOP_INFO, ...JSON.parse(shopInfoRaw) };
      } catch (e) {
        console.error("Failed to parse shop info from localStorage", e);
      }
    }
  }
  return DEFAULT_SHOP_INFO;
};

// Function to save shop info to localStorage
export const saveShopInfo = (shopInfo: ShopInfo) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("shopInfo", JSON.stringify(shopInfo));
    } catch (e) {
      console.error("Failed to save shop info to localStorage", e);
      throw new Error("Failed to save shop information");
    }
  }
};
