// import React, { useState } from "react";
// import {
//   ShoppingCart,
//   AlertCircle,
//   Clock,
//   Package,
//   Building2,
//   TrendingUp,
//   Plus,
//   Trash2,
//   CheckCircle2,
//   Send,
//   Filter,
//   Search,
//   ArrowUpDown,
//   Zap,
//   DollarSign,
//   Users,
//   Box,
//   Wrench,
//   ChevronDown,
//   ChevronRight,
// } from "lucide-react";

// // Sample data
// const shoppingListData = [
//   {
//     id: "1",
//     partName: "iPhone 13 Pro Screen - OLED",
//     quantityNeeded: 2,
//     currentStock: 0,
//     priority: "urgent",
//     relatedRepairs: ["R-001", "R-003"],
//     estimatedCost: 240,
//     addedAt: "2025-10-08T10:00:00",
//     status: "pending",
//     category: "Screen",
//     suggestedSuppliers: [
//       {
//         id: "1",
//         name: "TechParts Supply",
//         price: 120,
//         deliveryDays: 2,
//         reliability: 98,
//         inStock: true,
//       },
//       {
//         id: "2",
//         name: "Mobile Parts Direct",
//         price: 125,
//         deliveryDays: 3,
//         reliability: 92,
//         inStock: true,
//       },
//     ],
//   },
//   {
//     id: "2",
//     partName: "Samsung S21 Battery - OEM",
//     quantityNeeded: 1,
//     currentStock: 0,
//     priority: "urgent",
//     relatedRepairs: ["R-002"],
//     estimatedCost: 35,
//     addedAt: "2025-10-08T09:30:00",
//     status: "pending",
//     category: "Battery",
//     suggestedSuppliers: [
//       {
//         id: "3",
//         name: "Global Electronics Hub",
//         price: 35,
//         deliveryDays: 4,
//         reliability: 95,
//         inStock: true,
//       },
//       {
//         id: "1",
//         name: "TechParts Supply",
//         price: 38,
//         deliveryDays: 2,
//         reliability: 98,
//         inStock: true,
//       },
//     ],
//   },
//   {
//     id: "3",
//     partName: "iPhone 12 Charging Port Flex",
//     quantityNeeded: 3,
//     currentStock: 1,
//     priority: "high",
//     relatedRepairs: ["R-004", "R-007"],
//     estimatedCost: 90,
//     addedAt: "2025-10-07T14:20:00",
//     status: "pending",
//     category: "Port",
//     suggestedSuppliers: [
//       {
//         id: "5",
//         name: "Swift Supply Solutions",
//         price: 30,
//         deliveryDays: 2,
//         reliability: 99,
//         inStock: true,
//       },
//       {
//         id: "1",
//         name: "TechParts Supply",
//         price: 32,
//         deliveryDays: 2,
//         reliability: 98,
//         inStock: true,
//       },
//     ],
//   },
//   {
//     id: "4",
//     partName: "Xiaomi Mi 11 Back Glass",
//     quantityNeeded: 2,
//     currentStock: 0,
//     priority: "normal",
//     relatedRepairs: ["R-005"],
//     estimatedCost: 50,
//     addedAt: "2025-10-07T11:00:00",
//     status: "pending",
//     category: "Back Glass",
//     suggestedSuppliers: [
//       {
//         id: "2",
//         name: "Mobile Parts Direct",
//         price: 25,
//         deliveryDays: 5,
//         reliability: 92,
//         inStock: false,
//       },
//       {
//         id: "3",
//         name: "Global Electronics Hub",
//         price: 28,
//         deliveryDays: 4,
//         reliability: 95,
//         inStock: true,
//       },
//     ],
//   },
//   {
//     id: "5",
//     partName: "iPhone 11 Camera Module",
//     quantityNeeded: 1,
//     currentStock: 2,
//     priority: "low",
//     relatedRepairs: [],
//     estimatedCost: 45,
//     addedAt: "2025-10-06T16:45:00",
//     status: "pending",
//     category: "Camera",
//     suggestedSuppliers: [
//       {
//         id: "1",
//         name: "TechParts Supply",
//         price: 45,
//         deliveryDays: 2,
//         reliability: 98,
//         inStock: true,
//       },
//     ],
//   },
//   {
//     id: "6",
//     partName: "Samsung S20 Screen Adhesive",
//     quantityNeeded: 5,
//     currentStock: 0,
//     priority: "high",
//     relatedRepairs: ["R-008", "R-009"],
//     estimatedCost: 25,
//     addedAt: "2025-10-08T08:15:00",
//     status: "pending",
//     category: "Adhesive",
//     suggestedSuppliers: [
//       {
//         id: "5",
//         name: "Swift Supply Solutions",
//         price: 5,
//         deliveryDays: 2,
//         reliability: 99,
//         inStock: true,
//       },
//     ],
//   },
// ];

// const ShoppingListPage = () => {
//   const [items, setItems] = useState(shoppingListData);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [priorityFilter, setPriorityFilter] = useState("all");
//   const [groupBy, setGroupBy] = useState("none"); // none, supplier, priority, category
//   const [selectedItems, setSelectedItems] = useState([]);
//   const [expandedGroups, setExpandedGroups] = useState({});

//   // Calculate metrics
//   const totalItems = items.length;
//   const urgentItems = items.filter((i) => i.priority === "urgent").length;
//   const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
//   const blockedRepairs = [...new Set(items.flatMap((i) => i.relatedRepairs))]
//     .length;

//   // Filter items
//   const filteredItems = items.filter((item) => {
//     const matchesSearch = item.partName
//       .toLowerCase()
//       .includes(searchTerm.toLowerCase());
//     const matchesPriority =
//       priorityFilter === "all" || item.priority === priorityFilter;
//     return matchesSearch && matchesPriority;
//   });

//   // Group items
//   const groupedItems = () => {
//     if (groupBy === "none") return { "All Items": filteredItems };

//     if (groupBy === "supplier") {
//       const grouped = {};
//       filteredItems.forEach((item) => {
//         const bestSupplier = item.suggestedSuppliers[0];
//         const supplierName = bestSupplier?.name || "No Supplier";
//         if (!grouped[supplierName]) grouped[supplierName] = [];
//         grouped[supplierName].push(item);
//       });
//       return grouped;
//     }

//     if (groupBy === "priority") {
//       const order = ["urgent", "high", "normal", "low"];
//       const grouped = {};
//       order.forEach((priority) => {
//         const items = filteredItems.filter((i) => i.priority === priority);
//         if (items.length > 0) {
//           grouped[priority.charAt(0).toUpperCase() + priority.slice(1)] = items;
//         }
//       });
//       return grouped;
//     }

//     if (groupBy === "category") {
//       const grouped = {};
//       filteredItems.forEach((item) => {
//         if (!grouped[item.category]) grouped[item.category] = [];
//         grouped[item.category].push(item);
//       });
//       return grouped;
//     }

//     return { "All Items": filteredItems };
//   };

//   const toggleGroup = (groupName) => {
//     setExpandedGroups((prev) => ({
//       ...prev,
//       [groupName]: !prev[groupName],
//     }));
//   };

//   const toggleSelectItem = (itemId) => {
//     setSelectedItems((prev) =>
//       prev.includes(itemId)
//         ? prev.filter((id) => id !== itemId)
//         : [...prev, itemId]
//     );
//   };

//   const selectAll = () => {
//     setSelectedItems(filteredItems.map((i) => i.id));
//   };

//   const deselectAll = () => {
//     setSelectedItems([]);
//   };

//   const handleDelete = (itemId) => {
//     if (confirm("Remove this item from shopping list?")) {
//       setItems(items.filter((i) => i.id !== itemId));
//       setSelectedItems(selectedItems.filter((id) => id !== itemId));
//     }
//   };

//   const createPurchaseOrder = () => {
//     const selected = items.filter((i) => selectedItems.includes(i.id));
//     alert(
//       `Creating purchase order for ${
//         selected.length
//       } items...\nTotal: $${selected
//         .reduce((sum, i) => sum + i.estimatedCost, 0)
//         .toFixed(2)}`
//     );
//   };

//   const getPriorityBadge = (priority) => {
//     const badges = {
//       urgent: {
//         color: "bg-red-100 text-red-700 border-red-300",
//         icon: AlertCircle,
//         label: "URGENT",
//       },
//       high: {
//         color: "bg-orange-100 text-orange-700 border-orange-300",
//         icon: Zap,
//         label: "High",
//       },
//       normal: {
//         color: "bg-blue-100 text-blue-700 border-blue-300",
//         icon: Clock,
//         label: "Normal",
//       },
//       low: {
//         color: "bg-gray-100 text-gray-700 border-gray-300",
//         icon: Clock,
//         label: "Low",
//       },
//     };
//     return badges[priority] || badges.normal;
//   };

//   const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
//     const colorClasses = {
//       blue: "bg-blue-100 text-blue-600",
//       red: "bg-red-100 text-red-600",
//       green: "bg-green-100 text-green-600",
//       orange: "bg-orange-100 text-orange-600",
//     };

//     return (
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex items-center gap-3 mb-2">
//           <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
//             <Icon className="w-5 h-5" />
//           </div>
//           <span className="text-sm font-medium text-gray-600">{title}</span>
//         </div>
//         <div className="mt-3">
//           <div className="text-2xl font-bold text-gray-900">{value}</div>
//           {subtitle && (
//             <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const ShoppingListItem = ({ item }) => {
//     const priorityBadge = getPriorityBadge(item.priority);
//     const bestSupplier = item.suggestedSuppliers[0];
//     const isSelected = selectedItems.includes(item.id);

//     return (
//       <div
//         className={`border rounded-lg p-4 transition-all ${
//           isSelected
//             ? "bg-blue-50 border-blue-300"
//             : "bg-white border-gray-200 hover:border-gray-300"
//         }`}
//       >
//         <div className="flex items-start gap-4">
//           {/* Checkbox */}
//           <input
//             type="checkbox"
//             checked={isSelected}
//             onChange={() => toggleSelectItem(item.id)}
//             className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
//           />

//           {/* Content */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-start justify-between gap-4 mb-3">
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   <h3 className="font-semibold text-gray-900">
//                     {item.partName}
//                   </h3>
//                   <div
//                     className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityBadge.color}`}
//                   >
//                     <priorityBadge.icon className="w-3 h-3" />
//                     {priorityBadge.label}
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-4 text-sm text-gray-600">
//                   <span className="flex items-center gap-1">
//                     <Package className="w-4 h-4" />
//                     Need: {item.quantityNeeded} | Stock: {item.currentStock}
//                   </span>
//                   {item.relatedRepairs.length > 0 && (
//                     <span className="flex items-center gap-1">
//                       <Wrench className="w-4 h-4" />
//                       {item.relatedRepairs.length} repair
//                       {item.relatedRepairs.length > 1 ? "s" : ""}
//                     </span>
//                   )}
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="text-lg font-bold text-gray-900">
//                   ${item.estimatedCost.toFixed(2)}
//                 </div>
//                 <div className="text-xs text-gray-500">Total cost</div>
//               </div>
//             </div>

//             {/* Supplier Info */}
//             {bestSupplier && (
//               <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                 <div className="flex items-center gap-3">
//                   <Building2 className="w-4 h-4 text-gray-500" />
//                   <div>
//                     <div className="font-medium text-sm text-gray-900">
//                       {bestSupplier.name}
//                     </div>
//                     <div className="text-xs text-gray-600">
//                       ${bestSupplier.price.toFixed(2)} each •{" "}
//                       {bestSupplier.deliveryDays} days •{" "}
//                       {bestSupplier.reliability}% reliable
//                     </div>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {bestSupplier.inStock ? (
//                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
//                       <CheckCircle2 className="w-3 h-3" />
//                       In Stock
//                     </span>
//                   ) : (
//                     <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
//                       <Clock className="w-3 h-3" />
//                       On Order
//                     </span>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Related Repairs */}
//             {item.relatedRepairs.length > 0 && (
//               <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
//                 <span className="font-medium">Needed for:</span>
//                 {item.relatedRepairs.map((repairId) => (
//                   <span
//                     key={repairId}
//                     className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono"
//                   >
//                     {repairId}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Actions */}
//           <button
//             onClick={() => handleDelete(item.id)}
//             className="p-2 hover:bg-red-50 rounded-lg transition-colors"
//             title="Remove from list"
//           >
//             <Trash2 className="w-4 h-4 text-red-600" />
//           </button>
//         </div>
//       </div>
//     );
//   };

//   const grouped = groupedItems();

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-7xl mx-auto space-y-6">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
//               <ShoppingCart className="w-8 h-8 text-blue-600" />
//               Shopping List
//             </h1>
//             <p className="text-gray-600 mt-1">
//               Parts needed for repairs and inventory restocking
//             </p>
//           </div>
//           <button
//             onClick={() => alert("Add manual item form")}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
//           >
//             <Plus className="w-4 h-4" />
//             Add Item Manually
//           </button>
//         </div>

//         {/* Summary Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           <StatCard
//             icon={Package}
//             title="Total Items"
//             value={totalItems}
//             subtitle="Parts to order"
//             color="blue"
//           />
//           <StatCard
//             icon={AlertCircle}
//             title="Urgent Items"
//             value={urgentItems}
//             subtitle="Need immediate attention"
//             color="red"
//           />
//           <StatCard
//             icon={DollarSign}
//             title="Estimated Cost"
//             value={`$${totalCost.toFixed(2)}`}
//             subtitle="Total if ordered now"
//             color="green"
//           />
//           <StatCard
//             icon={Wrench}
//             title="Blocked Repairs"
//             value={blockedRepairs}
//             subtitle="Waiting for parts"
//             color="orange"
//           />
//         </div>

//         {/* Filters & Actions Bar */}
//         <div className="bg-white rounded-lg border border-gray-200 p-4">
//           <div className="flex flex-col lg:flex-row gap-4">
//             {/* Search */}
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
//               <input
//                 type="text"
//                 placeholder="Search parts..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             {/* Priority Filter */}
//             <select
//               value={priorityFilter}
//               onChange={(e) => setPriorityFilter(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Priorities</option>
//               <option value="urgent">Urgent Only</option>
//               <option value="high">High Priority</option>
//               <option value="normal">Normal</option>
//               <option value="low">Low Priority</option>
//             </select>

//             {/* Group By */}
//             <select
//               value={groupBy}
//               onChange={(e) => setGroupBy(e.target.value)}
//               className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="none">No Grouping</option>
//               <option value="supplier">Group by Supplier</option>
//               <option value="priority">Group by Priority</option>
//               <option value="category">Group by Category</option>
//             </select>
//           </div>

//           {/* Bulk Actions */}
//           {selectedItems.length > 0 && (
//             <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <span className="text-sm font-medium text-gray-700">
//                   {selectedItems.length} item
//                   {selectedItems.length > 1 ? "s" : ""} selected
//                 </span>
//                 <button
//                   onClick={selectAll}
//                   className="text-sm text-blue-600 hover:text-blue-700 font-medium"
//                 >
//                   Select All
//                 </button>
//                 <button
//                   onClick={deselectAll}
//                   className="text-sm text-gray-600 hover:text-gray-700 font-medium"
//                 >
//                   Deselect All
//                 </button>
//               </div>
//               <button
//                 onClick={createPurchaseOrder}
//                 className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
//               >
//                 <Send className="w-4 h-4" />
//                 Create Purchase Order
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Shopping List Items */}
//         <div className="space-y-4">
//           {Object.entries(grouped).map(([groupName, groupItems]) => (
//             <div
//               key={groupName}
//               className="bg-white rounded-lg border border-gray-200 overflow-hidden"
//             >
//               {/* Group Header */}
//               {groupBy !== "none" && (
//                 <button
//                   onClick={() => toggleGroup(groupName)}
//                   className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
//                 >
//                   <div className="flex items-center gap-3">
//                     {expandedGroups[groupName] !== false ? (
//                       <ChevronDown className="w-5 h-5 text-gray-500" />
//                     ) : (
//                       <ChevronRight className="w-5 h-5 text-gray-500" />
//                     )}
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       {groupName}
//                     </h3>
//                     <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
//                       {groupItems.length} item{groupItems.length > 1 ? "s" : ""}
//                     </span>
//                   </div>
//                   <div className="text-sm text-gray-600">
//                     $
//                     {groupItems
//                       .reduce((sum, i) => sum + i.estimatedCost, 0)
//                       .toFixed(2)}{" "}
//                     total
//                   </div>
//                 </button>
//               )}

//               {/* Group Items */}
//               {(groupBy === "none" || expandedGroups[groupName] !== false) && (
//                 <div className="p-4 space-y-3">
//                   {groupItems.map((item) => (
//                     <ShoppingListItem key={item.id} item={item} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}

//           {/* Empty State */}
//           {filteredItems.length === 0 && (
//             <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
//               <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">
//                 No items in shopping list
//               </h3>
//               <p className="text-gray-500 mb-4">
//                 {searchTerm || priorityFilter !== "all"
//                   ? "Try adjusting your filters"
//                   : "Items will appear here when parts are needed for repairs"}
//               </p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShoppingListPage;

import React, { useState } from "react";
import {
  ShoppingCart,
  AlertCircle,
  Clock,
  Package,
  Building2,
  TrendingUp,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Filter,
  Search,
  ArrowUpDown,
  Zap,
  DollarSign,
  Users,
  Box,
  Wrench,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Sample data
const shoppingListData = [
  {
    id: "1",
    partName: "iPhone 13 Pro Screen - OLED",
    quantityNeeded: 2,
    currentStock: 0,
    priority: "urgent",
    relatedRepairs: ["R-001", "R-003"],
    estimatedCost: 240,
    addedAt: "2025-10-08T10:00:00",
    status: "pending",
    category: "Screen",
    suggestedSuppliers: [
      {
        id: "1",
        name: "TechParts Supply",
        price: 120,
        deliveryDays: 2,
        reliability: 98,
        inStock: true,
      },
      {
        id: "2",
        name: "Mobile Parts Direct",
        price: 125,
        deliveryDays: 3,
        reliability: 92,
        inStock: true,
      },
    ],
  },
  {
    id: "2",
    partName: "Samsung S21 Battery - OEM",
    quantityNeeded: 1,
    currentStock: 0,
    priority: "urgent",
    relatedRepairs: ["R-002"],
    estimatedCost: 35,
    addedAt: "2025-10-08T09:30:00",
    status: "pending",
    category: "Battery",
    suggestedSuppliers: [
      {
        id: "3",
        name: "Global Electronics Hub",
        price: 35,
        deliveryDays: 4,
        reliability: 95,
        inStock: true,
      },
      {
        id: "1",
        name: "TechParts Supply",
        price: 38,
        deliveryDays: 2,
        reliability: 98,
        inStock: true,
      },
    ],
  },
  {
    id: "3",
    partName: "iPhone 12 Charging Port Flex",
    quantityNeeded: 3,
    currentStock: 1,
    priority: "high",
    relatedRepairs: ["R-004", "R-007"],
    estimatedCost: 90,
    addedAt: "2025-10-07T14:20:00",
    status: "pending",
    category: "Port",
    suggestedSuppliers: [
      {
        id: "5",
        name: "Swift Supply Solutions",
        price: 30,
        deliveryDays: 2,
        reliability: 99,
        inStock: true,
      },
      {
        id: "1",
        name: "TechParts Supply",
        price: 32,
        deliveryDays: 2,
        reliability: 98,
        inStock: true,
      },
    ],
  },
  {
    id: "4",
    partName: "Xiaomi Mi 11 Back Glass",
    quantityNeeded: 2,
    currentStock: 0,
    priority: "normal",
    relatedRepairs: ["R-005"],
    estimatedCost: 50,
    addedAt: "2025-10-07T11:00:00",
    status: "pending",
    category: "Back Glass",
    suggestedSuppliers: [
      {
        id: "2",
        name: "Mobile Parts Direct",
        price: 25,
        deliveryDays: 5,
        reliability: 92,
        inStock: false,
      },
      {
        id: "3",
        name: "Global Electronics Hub",
        price: 28,
        deliveryDays: 4,
        reliability: 95,
        inStock: true,
      },
    ],
  },
  {
    id: "5",
    partName: "iPhone 11 Camera Module",
    quantityNeeded: 1,
    currentStock: 2,
    priority: "low",
    relatedRepairs: [],
    estimatedCost: 45,
    addedAt: "2025-10-06T16:45:00",
    status: "pending",
    category: "Camera",
    suggestedSuppliers: [
      {
        id: "1",
        name: "TechParts Supply",
        price: 45,
        deliveryDays: 2,
        reliability: 98,
        inStock: true,
      },
    ],
  },
  {
    id: "6",
    partName: "Samsung S20 Screen Adhesive",
    quantityNeeded: 5,
    currentStock: 0,
    priority: "high",
    relatedRepairs: ["R-008", "R-009"],
    estimatedCost: 25,
    addedAt: "2025-10-08T08:15:00",
    status: "pending",
    category: "Adhesive",
    suggestedSuppliers: [
      {
        id: "5",
        name: "Swift Supply Solutions",
        price: 5,
        deliveryDays: 2,
        reliability: 99,
        inStock: true,
      },
    ],
  },
];

const ShoppingListPage = () => {
  const [items, setItems] = useState(shoppingListData);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("none"); // none, supplier, priority, category
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Calculate metrics
  const totalItems = items.length;
  const urgentItems = items.filter((i) => i.priority === "urgent").length;
  const totalCost = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const blockedRepairs = [...new Set(items.flatMap((i) => i.relatedRepairs))]
    .length;

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.partName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === "all" || item.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Group items
  const groupedItems = () => {
    if (groupBy === "none") return { "All Items": filteredItems };

    if (groupBy === "supplier") {
      const grouped: Record<string, typeof filteredItems> = {};
      filteredItems.forEach((item) => {
        const bestSupplier = item.suggestedSuppliers[0];
        const supplierName = bestSupplier?.name || "No Supplier";
        if (!grouped[supplierName]) grouped[supplierName] = [];
        grouped[supplierName].push(item);
      });
      return grouped;
    }

    if (groupBy === "priority") {
      const order = ["urgent", "high", "normal", "low"];
      const grouped: Record<string, typeof filteredItems> = {};
      order.forEach((priority) => {
        const items = filteredItems.filter((i) => i.priority === priority);
        if (items.length > 0) {
          grouped[priority.charAt(0).toUpperCase() + priority.slice(1)] = items;
        }
      });
      return grouped;
    }

    if (groupBy === "category") {
      const grouped: Record<string, typeof filteredItems> = {};
      filteredItems.forEach((item) => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
      });
      return grouped;
    }

    return { "All Items": filteredItems };
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectAll = () => {
    setSelectedItems(filteredItems.map((i) => i.id));
  };

  const deselectAll = () => {
    setSelectedItems([]);
  };

  const handleDelete = (itemId: string) => {
    if (confirm("Remove this item from shopping list?")) {
      setItems(items.filter((i) => i.id !== itemId));
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const createPurchaseOrder = () => {
    const selected = items.filter((i) => selectedItems.includes(i.id));
    alert(
      `Creating purchase order for ${
        selected.length
      } items...\nTotal: $${selected
        .reduce((sum, i) => sum + i.estimatedCost, 0)
        .toFixed(2)}`
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { 
      color: string; 
      icon: React.ComponentType<{ className?: string }>; 
      label: string 
    }> = {
      urgent: {
        color: "bg-red-100 text-red-700 border-red-300",
        icon: AlertCircle,
        label: "URGENT",
      },
      high: {
        color: "bg-orange-100 text-orange-700 border-orange-300",
        icon: Zap,
        label: "High",
      },
      normal: {
        color: "bg-blue-100 text-blue-700 border-blue-300",
        icon: Clock,
        label: "Normal",
      },
      low: {
        color: "bg-gray-100 text-gray-700 border-gray-300",
        icon: Clock,
        label: "Low",
      },
    };
    return badges[priority] || badges.normal;
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }: { 
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => {
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-100 text-blue-600",
      red: "bg-red-100 text-red-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">{title}</span>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-500 mt-1">{subtitle}</div>
          )}
        </div>
      </div>
    );
  };

  const ShoppingListItem = ({ item }: { item: typeof shoppingListData[0] }) => {
    const priorityBadge = getPriorityBadge(item.priority);
    const bestSupplier = item.suggestedSuppliers[0];
    const isSelected = selectedItems.includes(item.id);

    return (
      <div
        className={`border rounded-lg p-4 transition-all ${
          isSelected
            ? "bg-blue-50 border-blue-300"
            : "bg-white border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelectItem(item.id)}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.partName}
                  </h3>
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${priorityBadge.color}`}
                  >
                    <priorityBadge.icon className="w-3 h-3" />
                    {priorityBadge.label}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    Need: {item.quantityNeeded} | Stock: {item.currentStock}
                  </span>
                  {item.relatedRepairs.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Wrench className="w-4 h-4" />
                      {item.relatedRepairs.length} repair
                      {item.relatedRepairs.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  ${item.estimatedCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">Total cost</div>
              </div>
            </div>

            {/* Supplier Info */}
            {bestSupplier && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {bestSupplier.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      ${bestSupplier.price.toFixed(2)} each •{" "}
                      {bestSupplier.deliveryDays} days •{" "}
                      {bestSupplier.reliability}% reliable
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {bestSupplier.inStock ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      On Order
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Related Repairs */}
            {item.relatedRepairs.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-medium">Needed for:</span>
                {item.relatedRepairs.map((repairId) => (
                  <span
                    key={repairId}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-mono"
                  >
                    {repairId}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove from list"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>
    );
  };

  const grouped = groupedItems();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              Shopping List
            </h1>
            <p className="text-gray-600 mt-1">
              Parts needed for repairs and inventory restocking
            </p>
          </div>
          <button
            onClick={() => alert("Add manual item form")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Item Manually
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Package}
            title="Total Items"
            value={totalItems}
            subtitle="Parts to order"
            color="blue"
          />
          <StatCard
            icon={AlertCircle}
            title="Urgent Items"
            value={urgentItems}
            subtitle="Need immediate attention"
            color="red"
          />
          <StatCard
            icon={DollarSign}
            title="Estimated Cost"
            value={`$${totalCost.toFixed(2)}`}
            subtitle="Total if ordered now"
            color="green"
          />
          <StatCard
            icon={Wrench}
            title="Blocked Repairs"
            value={blockedRepairs}
            subtitle="Waiting for parts"
            color="orange"
          />
        </div>

        {/* Filters & Actions Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="high">High Priority</option>
              <option value="normal">Normal</option>
              <option value="low">Low Priority</option>
            </select>

            {/* Group By */}
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Grouping</option>
              <option value="supplier">Group by Supplier</option>
              <option value="priority">Group by Priority</option>
              <option value="category">Group by Category</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  {selectedItems.length} item
                  {selectedItems.length > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAll}
                  className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                >
                  Deselect All
                </button>
              </div>
              <button
                onClick={createPurchaseOrder}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                <Send className="w-4 h-4" />
                Create Purchase Order
              </button>
            </div>
          )}
        </div>

        {/* Shopping List Items */}
        <div className="space-y-4">
          {Object.entries(grouped).map(([groupName, groupItems]) => (
            <div
              key={groupName}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Group Header */}
              {groupBy !== "none" && (
                <button
                  onClick={() => toggleGroup(groupName)}
                  className="w-full px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedGroups[groupName] !== false ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {groupName}
                    </h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                      {groupItems.length} item{groupItems.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    $
                    {groupItems
                      .reduce((sum, i) => sum + i.estimatedCost, 0)
                      .toFixed(2)}{" "}
                    total
                  </div>
                </button>
              )}

              {/* Group Items */}
              {(groupBy === "none" || expandedGroups[groupName] !== false) && (
                <div className="p-4 space-y-3">
                  {groupItems.map((item) => (
                    <ShoppingListItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No items in shopping list
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || priorityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Items will appear here when parts are needed for repairs"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingListPage;
