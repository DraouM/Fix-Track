-- Insert mock repairs data
INSERT INTO repairs (id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at) VALUES
('REP001', 'John Smith', '555-0101', 'Apple', 'iPhone 13 Pro', 'Screen cracked, needs replacement', 199.99, 'Completed', 'Paid', '2024-01-15 09:30:00', '2024-01-18 14:20:00'),
('REP002', 'Maria Garcia', '555-0102', 'Samsung', 'Galaxy S22', 'Battery draining quickly, needs replacement', 89.99, 'In Progress', 'Partially Paid', '2024-01-16 10:15:00', '2024-01-19 11:30:00'),
('REP003', 'Robert Johnson', '555-0103', 'Google', 'Pixel 7', 'Charging port not working', 129.99, 'Pending', 'Unpaid', '2024-01-17 14:45:00', '2024-01-17 14:45:00'),
('REP004', 'Sarah Wilson', '555-0104', 'Apple', 'iPad Air 5', 'Back camera not focusing', 149.99, 'Delivered', 'Paid', '2024-01-18 11:20:00', '2024-01-20 16:45:00'),
('REP005', 'Michael Brown', '555-0105', 'Samsung', 'Galaxy Tab S8', 'Screen flickering issue', 219.99, 'Completed', 'Partially Paid', '2024-01-19 13:10:00', '2024-01-22 10:15:00'),
('REP006', 'Jennifer Davis', '555-0106', 'Apple', 'MacBook Air M2', 'Keyboard keys not working', 299.99, 'In Progress', 'Unpaid', '2024-01-20 15:30:00', '2024-01-23 09:45:00'),
('REP007', 'David Miller', '555-0107', 'Dell', 'XPS 13', 'Overheating and fan noise', 189.99, 'Pending', 'Unpaid', '2024-01-21 16:45:00', '2024-01-21 16:45:00'),
('REP008', 'Lisa Martinez', '555-0108', 'HP', 'Spectre x360', 'Battery replacement needed', 129.99, 'Completed', 'Paid', '2024-01-22 10:20:00', '2024-01-25 14:30:00'),
('REP009', 'James Wilson', '555-0109', 'Apple', 'iPhone 12', 'Water damage, won''t turn on', 249.99, 'In Progress', 'Unpaid', '2024-01-23 11:30:00', '2024-01-26 15:20:00'),
('REP010', 'Emily Thompson', '555-0110', 'Samsung', 'Galaxy Z Flip', 'Hinge mechanism broken', 349.99, 'Pending', 'Unpaid', '2024-01-24 14:15:00', '2024-01-24 14:15:00');

-- Insert mock repair payments data
INSERT INTO repair_payments (id, repair_id, amount, date, method, received_by) VALUES
('PAY001', 'REP001', 199.99, '2024-01-18 14:20:00', 'Credit Card', 'tech_john'),
('PAY002', 'REP002', 50.00, '2024-01-19 11:30:00', 'Cash', 'tech_sarah'),
('PAY003', 'REP002', 39.99, '2024-01-20 15:45:00', 'Debit Card', 'tech_mike'),
('PAY004', 'REP004', 149.99, '2024-01-20 16:45:00', 'Bank Transfer', 'tech_john'),
('PAY005', 'REP005', 100.00, '2024-01-22 10:15:00', 'Cash', 'tech_sarah'),
('PAY006', 'REP005', 50.00, '2024-01-23 14:30:00', 'Credit Card', 'tech_mike'),
('PAY007', 'REP008', 129.99, '2024-01-25 14:30:00', 'Cash', 'tech_john'),
('PAY008', 'REP001', 25.00, '2024-01-15 09:45:00', 'Cash', 'tech_sarah'), -- Deposit
('PAY009', 'REP004', 75.00, '2024-01-18 14:00:00', 'Debit Card', 'tech_mike'); -- Deposit

-- Insert mock repair used parts data
INSERT INTO repair_used_parts (id, repair_id, part_id, part_name, quantity, unit_price) VALUES
('PART001', 'REP001', 'SCR-IP13P', 'iPhone 13 Pro OLED Screen', 1, 149.99),
('PART002', 'REP001', 'BATT-IP13', 'iPhone 13 Battery', 1, 50.00),
('PART003', 'REP002', 'BATT-SGS22', 'Samsung Galaxy S22 Battery', 1, 69.99),
('PART004', 'REP004', 'CAM-IPADAIR5', 'iPad Air 5 Rear Camera', 1, 119.99),
('PART005', 'REP005', 'SCR-GTABS8', 'Galaxy Tab S8 Display', 1, 179.99),
('PART006', 'REP005', 'DIG-GTABS8', 'Galaxy Tab S8 Digitizer', 1, 40.00),
('PART007', 'REP006', 'KB-MBAIRM2', 'MacBook Air M2 Keyboard', 1, 249.99),
('PART008', 'REP008', 'BATT-HPSPECTRE', 'HP Spectre Battery', 1, 99.99),
('PART009', 'REP009', 'LOG-IP12', 'iPhone 12 Logic Board', 1, 199.99),
('PART010', 'REP009', 'BATT-IP12', 'iPhone 12 Battery', 1, 45.00),
('PART011', 'REP010', 'HNG-GZFLIP', 'Galaxy Z Flip Hinge Assembly', 1, 299.99),
('PART012', 'REP010', 'SCR-GZFLIP', 'Galaxy Z Flip Main Screen', 1, 50.00);

-- Insert mock repair history data
INSERT INTO repair_history (id, repair_id, date, event_type, details, changed_by) VALUES
-- REP001 History
('HIST001', 'REP001', '2024-01-15 09:30:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST002', 'REP001', '2024-01-15 09:45:00', 'payment_added', 'Deposit received: $25.00 (Cash)', 'tech_sarah'),
('HIST003', 'REP001', '2024-01-16 10:00:00', 'status_change', 'Status changed to: In Progress', 'tech_john'),
('HIST004', 'REP001', '2024-01-16 11:30:00', 'part_added', 'Added part: iPhone 13 Pro OLED Screen', 'tech_john'),
('HIST005', 'REP001', '2024-01-16 11:35:00', 'part_added', 'Added part: iPhone 13 Battery', 'tech_john'),
('HIST006', 'REP001', '2024-01-18 14:00:00', 'status_change', 'Status changed to: Completed', 'tech_john'),
('HIST007', 'REP001', '2024-01-18 14:20:00', 'payment_added', 'Final payment received: $174.99 (Credit Card)', 'tech_john'),
('HIST008', 'REP001', '2024-01-18 14:30:00', 'status_change', 'Status changed to: Delivered', 'tech_john'),

-- REP002 History
('HIST009', 'REP002', '2024-01-16 10:15:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST010', 'REP002', '2024-01-17 09:00:00', 'status_change', 'Status changed to: In Progress', 'tech_sarah'),
('HIST011', 'REP002', '2024-01-17 10:30:00', 'part_added', 'Added part: Samsung Galaxy S22 Battery', 'tech_sarah'),
('HIST012', 'REP002', '2024-01-19 11:30:00', 'payment_added', 'Partial payment received: $50.00 (Cash)', 'tech_sarah'),
('HIST013', 'REP002', '2024-01-20 15:45:00', 'payment_added', 'Additional payment received: $39.99 (Debit Card)', 'tech_mike'),

-- REP004 History
('HIST014', 'REP004', '2024-01-18 11:20:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST015', 'REP004', '2024-01-18 14:00:00', 'payment_added', 'Deposit received: $75.00 (Debit Card)', 'tech_mike'),
('HIST016', 'REP004', '2024-01-18 14:30:00', 'status_change', 'Status changed to: In Progress', 'tech_mike'),
('HIST017', 'REP004', '2024-01-18 15:45:00', 'part_added', 'Added part: iPad Air 5 Rear Camera', 'tech_mike'),
('HIST018', 'REP004', '2024-01-20 15:00:00', 'status_change', 'Status changed to: Completed', 'tech_mike'),
('HIST019', 'REP004', '2024-01-20 16:45:00', 'payment_added', 'Final payment received: $74.99 (Bank Transfer)', 'tech_john'),
('HIST020', 'REP004', '2024-01-20 17:00:00', 'status_change', 'Status changed to: Delivered', 'tech_mike'),

-- REP005 History
('HIST021', 'REP005', '2024-01-19 13:10:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST022', 'REP005', '2024-01-20 09:30:00', 'status_change', 'Status changed to: In Progress', 'tech_john'),
('HIST023', 'REP005', '2024-01-20 10:45:00', 'part_added', 'Added part: Galaxy Tab S8 Display', 'tech_john'),
('HIST024', 'REP005', '2024-01-20 11:00:00', 'part_added', 'Added part: Galaxy Tab S8 Digitizer', 'tech_john'),
('HIST025', 'REP005', '2024-01-22 10:15:00', 'payment_added', 'Partial payment received: $100.00 (Cash)', 'tech_sarah'),
('HIST026', 'REP005', '2024-01-22 09:30:00', 'status_change', 'Status changed to: Completed', 'tech_john'),
('HIST027', 'REP005', '2024-01-23 14:30:00', 'payment_added', 'Additional payment received: $50.00 (Credit Card)', 'tech_mike'),

-- REP008 History
('HIST028', 'REP008', '2024-01-22 10:20:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST029', 'REP008', '2024-01-23 11:00:00', 'status_change', 'Status changed to: In Progress', 'tech_john'),
('HIST030', 'REP008', '2024-01-23 12:30:00', 'part_added', 'Added part: HP Spectre Battery', 'tech_john'),
('HIST031', 'REP008', '2024-01-25 14:00:00', 'status_change', 'Status changed to: Completed', 'tech_john'),
('HIST032', 'REP008', '2024-01-25 14:30:00', 'payment_added', 'Full payment received: $129.99 (Cash)', 'tech_john'),

-- Additional notes and events
('HIST033', 'REP003', '2024-01-17 14:45:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST034', 'REP003', '2024-01-18 10:00:00', 'note', 'Waiting for charging port part to arrive', 'tech_sarah'),

('HIST035', 'REP006', '2024-01-20 15:30:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST036', 'REP006', '2024-01-21 09:15:00', 'status_change', 'Status changed to: In Progress', 'tech_mike'),
('HIST037', 'REP006', '2024-01-21 10:45:00', 'part_added', 'Added part: MacBook Air M2 Keyboard', 'tech_mike'),

('HIST038', 'REP007', '2024-01-21 16:45:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST039', 'REP007', '2024-01-22 11:30:00', 'note', 'Diagnosis: Fan needs replacement and thermal paste', 'tech_john'),

('HIST040', 'REP009', '2024-01-23 11:30:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST041', 'REP009', '2024-01-24 14:00:00', 'status_change', 'Status changed to: In Progress', 'tech_sarah'),
('HIST042', 'REP009', '2024-01-24 15:30:00', 'part_added', 'Added part: iPhone 12 Logic Board', 'tech_sarah'),
('HIST043', 'REP009', '2024-01-24 16:00:00', 'part_added', 'Added part: iPhone 12 Battery', 'tech_sarah'),

('HIST044', 'REP010', '2024-01-24 14:15:00', 'status_change', 'Repair created - status: Pending', 'system'),
('HIST045', 'REP010', '2024-01-25 10:00:00', 'note', 'Special order hinge assembly required', 'tech_mike');