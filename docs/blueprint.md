# **Fixary POS System**

## Overview

Fixary is a comprehensive Point of Sale (POS) system designed specifically for retail businesses, particularly repair shops and stores. Built with Next.js and Tauri, it combines a modern web interface with native desktop capabilities for optimal performance and hardware integration.

## Core Features

### 1. Dashboard & Analytics

- **Unified Cashier Dashboard**: Central hub for business operations with overview, cashier, and transactions tabs
- **Real-time Analytics**: Revenue charts, profit trends, and business metrics
- **Session Management**: Start and close daily sessions with opening/closing balances
- **Financial Tracking**: Monitor total in/out, net cash, expenses, and discrepancies
- **Inventory Alerts**: Low stock notifications and out-of-stock alerts
- **Active Repairs**: Track ongoing repair orders with status updates

### 2. Cashier Operations

- **Session Control**: Start day with opening balance, end day with closing procedures
- **Expense Management**: Add expenses with amounts and reasons
- **Transaction Processing**: Handle sales, repairs, and various transaction types
- **Payment Processing**: Support for multiple payment methods
- **Quick Actions**: Fast buttons for new sales, repairs, and inventory additions

### 3. Inventory Management

- **Item Tracking**: Add, update, and manage inventory items
- **Stock Levels**: Monitor quantities and set low stock thresholds
- **Inventory History**: Track changes and movements of inventory
- **Barcode Integration**: Hardware scanner support with Enter suffix configuration
- **Low Stock Alerts**: Visual indicators for items needing reordering

### 4. Repair Orders

- **Repair Creation**: Form for new repair orders with customer details, device info, and issue description
- **Status Tracking**: Multiple status options (Pending, In Progress, Waiting for Parts, Completed, Delivered)
- **Payment Management**: Track payments for repair orders
- **Used Parts Tracking**: Record parts used in repairs
- **Repair History**: Maintain history of status changes and updates
- **Customer Communication**: Store contact information for updates

### 5. Sales Processing

- **Sale Creation**: Create new sales transactions
- **Item Selection**: Add items to sales from inventory
- **Payment Collection**: Process payments and complete sales
- **Receipt Generation**: Print receipts via ESC/POS thermal printers

### 6. Client Management

- **Customer Records**: Store client information and contact details
- **Payment Tracking**: Record payments made by customers
- **Transaction History**: View customer's purchase and repair history
- **Balance Management**: Track customer account balances

### 7. Supplier Management

- **Supplier Records**: Maintain supplier information
- **Credit Tracking**: Monitor supplier credit balances
- **Order Management**: Create and track orders from suppliers
- **Payment Processing**: Handle payments to suppliers

### 8. Order Management

- **Purchase Orders**: Create and track orders from suppliers
- **Order Status**: Monitor order progress from pending to received
- **Inventory Updates**: Automatically update inventory when orders arrive
- **Payment Tracking**: Record payments made for orders

### 9. Hardware Integration

- **ESC/POS Printing**: Support for thermal receipt printers
- **Barcode Scanners**: Hardware scanner integration with automatic item addition
- **Printer Detection**: Automatic detection and selection of available printers
- **Multiple Printer Types**: Support for USB, network, and Bluetooth printers

### 10. Reporting & Data Export

- **Revenue Reports**: Daily, weekly, and monthly revenue breakdowns
- **Transaction Histories**: Detailed logs of all transactions
- **Business Analytics**: Profit margins, popular items, and performance metrics

## Technical Architecture

### Frontend

- **Framework**: Next.js 14+ with App Router
- **UI Library**: Shadcn/ui components with Tailwind CSS
- **State Management**: React hooks and Context API
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React icons

### Backend

- **Framework**: Tauri with Rust backend
- **Database**: SQLite for local data storage
- **API Layer**: Tauri invoke commands for frontend-backend communication
- **Security**: Native desktop security model

### Key Libraries & Dependencies

- React for UI rendering
- Tauri for desktop integration
- SQLite for data persistence
- ESC/POS for receipt printing
- Recharts for data visualization
- Tailwind CSS for styling
- Radix UI for accessible components

## Style Guidelines

- **Theme**: Clean, professional light theme
- **Color Scheme**: Blue as primary color with appropriate accents for different states
- **Responsive Design**: Works on tablets, desktops, and various screen sizes
- **Accessibility**: Proper contrast ratios and keyboard navigation
- **Consistent Icons**: Lucide React icons throughout the application
- **Modular Layout**: Card-based design with clear visual hierarchy

## Hardware Requirements & Setup

### Recommended Hardware

- **Thermal Receipt Printer**: ESC/POS compatible for receipts and stickers
- **Barcode Scanner**: Configured to send Enter (CR/LF) suffix for auto-add functionality
- **Cash Drawer**: Connects to printer for automated opening
- **Customer Display**: Optional for showing transaction details

### Printer Setup

1. Install printer drivers from manufacturer
2. Connect printer via USB or network
3. Configure printer sharing if network-based
4. The system will automatically detect available printers

### Barcode Scanner Configuration

- Configure scanner to send Enter (CR/LF) after each scan
- This enables automatic item addition to the current transaction
- Works with most common USB and wireless scanners

## Best Practices & Tips

### Daily Operations

1. **Start Day**: Begin with setting opening cash balance
2. **Process Transactions**: Handle sales and repairs throughout the day
3. **Track Expenses**: Record daily expenses and withdrawals
4. **End Day**: Count cash, record closing amount, and close session

### Data Management

- Regularly backup database files
- Monitor inventory levels and set appropriate low-stock thresholds
- Keep customer information updated
- Review transaction histories for accuracy

### Performance Optimization

- Use barcode scanners for faster item entry
- Organize inventory with clear product names and SKUs
- Train staff on keyboard shortcuts and quick actions
- Regularly update software for bug fixes and improvements

## Troubleshooting

### Common Issues

- **Printer Not Detected**: Ensure drivers are installed and printer is connected
- **Barcode Scanner Not Working**: Check if scanner is configured to send Enter suffix
- **Slow Performance**: Large databases may require occasional cleanup
- **Sync Issues**: Verify database connections and permissions

### Error Recovery

- Session recovery is available if the application crashes mid-session
- Transaction logs maintain audit trails for reconciliation
- Database corruption protection through SQLite's built-in mechanisms

## Security Considerations

- Local data storage with no external dependencies
- No cloud sync required for basic operations
- Encrypted local database storage
- Access control through operating system permissions

## Development & Customization

### Extending Functionality

- API endpoints available for custom integrations
- Plugin architecture for adding new features
- Database schema documented for custom queries
- Component library for consistent UI additions

### Configuration Options

- Customizable receipt templates
- Adjustable tax settings
- Brand-specific theming
- Multi-language support potential

## Deployment

- Single executable for desktop deployment
- No server infrastructure required
- Works offline with local database
- Automatic updates available through Tauri

This comprehensive POS system provides all necessary functionality for retail businesses to manage sales, inventory, repairs, and customer relationships in one integrated platform.
