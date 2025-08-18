INSERT INTO inventory_items (
  id,
  item_name,
  phone_brand,
  item_type,
  buying_price,
  selling_price,
  quantity_in_stock,
  low_stock_threshold,
  supplier_info
) VALUES (
  '1',
  'iPhone 13 Screen',
  'Apple',
  'Screen',
  120.0,
  200.0,
  10,
  2,
  'Main Supplier'
);

SELECT *
FROM inventory_items;