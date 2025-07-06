# FixTrack Database Schema

This document outlines the conceptual database schema for the FixTrack application. It's designed to be adaptable for a NoSQL database like Firestore or a relational database like PostgreSQL.

## Core Entities

-   **Clients**: Stores information about customers.
-   **Repairs**: Tracks repair jobs for clients.
-   **InventoryItems**: Manages the stock of parts and accessories.
-   **Sales**: Records direct sales of items to clients.

---

### 1. `Clients` Collection

Stores information about each client.

| Field         | Type      | Description                                     | Notes                               |
| :------------ | :-------- | :---------------------------------------------- | :---------------------------------- |
| `id`          | `string`  | **Primary Key**. Unique identifier for the client. | e.g., `client_12345`                |
| `name`        | `string`  | Full name of the client.                        | Required.                           |
| `phoneNumber` | `string`  | Client's contact phone number.                  | Optional, but recommended.          |
| `address`     | `string`  | Client's physical or mailing address.           | Optional.                           |
| `debt`        | `number`  | Current outstanding balance. Can be negative (credit). | Defaults to `0`. Updates on sales/payments. |
| `createdAt`   | `timestamp` | Timestamp when the client was first added.      | Auto-generated.                     |

---

### 2. `Repairs` Collection

Tracks individual repair orders. Each repair is linked to a `Client`.

| Field              | Type      | Description                               | Notes                                 |
| :----------------- | :-------- | :---------------------------------------- | :------------------------------------ |
| `id`               | `string`  | **Primary Key**. Unique ID for the repair. | e.g., `repair_67890`                  |
| `clientId`         | `string`  | **Foreign Key** to the `Clients` collection. | Can be null if client is not saved.   |
| `customerName`     | `string`  | Name of the customer (can be denormalized).| Required.                           |
| `phoneNumber`      | `string`  | Customer's phone number (denormalized).    |                                       |
| `deviceBrand`      | `string`  | Brand of the device being repaired.       | e.g., 'Apple', 'Samsung'              |
| `deviceModel`      | `string`  | Model of the device.                      | e.g., 'iPhone 13', 'Galaxy S22'       |
| `issueDescription` | `text`    | Detailed description of the issue.        | Required.                           |
| `estimatedCost`    | `number`  | The quoted cost for the entire repair.    |                                       |
| `dateReceived`     | `timestamp` | Date and time the repair was logged.      |                                       |
| `dateCompleted`    | `timestamp` | Date and time the repair was completed.   | Nullable.                             |
| `repairStatus`     | `string`  | Current status of the repair.             | Enum: 'Pending', 'In Progress', 'Completed', 'Cancelled'. |
| `paymentStatus`    | `string`  | Current payment status.                   | Enum: 'Unpaid', 'Paid', 'Partially Paid', 'Refunded'. |

#### Sub-collection: `Repairs.StatusHistory`

A log of status changes for a repair.

| Field       | Type      | Description                            |
| :---------- | :-------- | :------------------------------------- |
| `id`        | `string`  | **Primary Key**. Unique history entry ID. |
| `status`    | `string`  | The status that was set.               |
| `timestamp` | `timestamp` | The time the status was updated.       |

#### Sub-collection: `Repairs.UsedParts`

A list of inventory items used in a repair. This acts as a join table.

| Field         | Type     | Description                                       |
| :------------ | :------- | :------------------------------------------------ |
| `itemId`      | `string` | **Foreign Key** to the `InventoryItems` collection. |
| `quantity`    | `number` | The number of units of the part used.             |
| `unitCost`    | `number` | The `buyingPrice` of the part at the time of use.   |
| `sellingPrice`| `number` | The price the part was "sold" for in the repair.  |

---

### 3. `InventoryItems` Collection

The central collection for managing stock.

| Field             | Type      | Description                               | Notes                               |
| :---------------- | :-------- | :---------------------------------------- | :---------------------------------- |
| `id`              | `string`  | **Primary Key**. Unique ID for the item.   | e.g., `inv_abcde`                   |
| `itemName`        | `string`  | Name of the item.                         | e.g., 'iPhone 13 Screen Assembly'     |
| `phoneBrand`      | `string`  | Associated phone brand.                   | Enum: 'Apple', 'Samsung', 'Other'...  |
| `itemType`        | `string`  | Type of item.                             | Enum: 'Screen', 'Battery', 'Cable'... |
| `buyingPrice`     | `number`  | How much the shop paid for the item.      |                                       |
| `sellingPrice`    | `number`  | The standard price for direct sale.       |                                       |
| `quantityInStock` | `number`  | The current number of units in stock.     | Integer.                            |
| `lowStockThreshold`| `number`  | Threshold to trigger a low stock warning. | Optional. Defaults to 5.            |
| `supplierInfo`    | `string`  | Information about the supplier.           | Optional.                           |

#### Sub-collection: `InventoryItems.History`

A log of all stock movements for an inventory item.

| Field          | Type      | Description                               | Notes                               |
| :------------- | :-------- | :---------------------------------------- | :---------------------------------- |
| `id`           | `string`  | **Primary Key**. Unique history event ID.  |                                       |
| `date`         | `timestamp` | When the event occurred.                  |                                       |
| `type`         | `string`  | The type of stock movement.               | Enum: 'Purchased', 'Used in Repair', 'Sold', 'Returned', 'Manual Correction'. |
| `quantityChange` | `number`  | The change in quantity (+ or -).          |                                       |
| `notes`        | `string`  | Optional notes about the event.           | e.g., 'Initial stock from Supplier X' |
| `relatedId`    | `string`  | **Foreign Key** to another collection.    | e.g., a `Repairs` ID or `Sales` ID. |

---

### 4. `Sales` Collection

Records direct over-the-counter sales.

| Field         | Type      | Description                               | Notes                 |
| :------------ | :-------- | :---------------------------------------- | :-------------------- |
| `id`          | `string`  | **Primary Key**. Unique ID for the sale.   | e.g., `sale_pqrst`    |
| `clientId`    | `string`  | **Foreign Key** to the `Clients` collection. |                       |
| `clientName`  | `string`  | Denormalized client name for quick display. |                       |
| `saleDate`    | `timestamp` | When the sale was made.                   |                       |
| `totalAmount` | `number`  | The total value of the sale.              | Sum of all sold items. |

#### Sub-collection: `Sales.SoldItems`

A list of items sold in a transaction.

| Field              | Type     | Description                                       |
| :----------------- | :------- | :------------------------------------------------ |
| `itemId`           | `string` | **Foreign Key** to the `InventoryItems` collection. |
| `quantity`         | `number` | The number of units sold.                         |
| `sellingPriceAtSale` | `number` | The price per unit at the time of sale.         |
