-- DROP TABLE IF EXISTS repairs;
-- DROP TABLE IF EXISTS repair_payments;
-- DROP TABLE IF EXISTS repair_used_parts;
-- DROP TABLE IF EXISTS repair_history;

-- Insert mock repairs data
insert into repairs (id, customer_name, customer_phone, device_brand, device_model, issue_description, estimated_cost, status, payment_status, created_at, updated_at) values ('6e199e1c-4fea-49a6-ab91-aea8bc46b413', 'Benni Moncreiff', '278-398-5708', 'OnePlus', 'Mi 13', 'Battery replacement', 339, 'Completed', 'Unpaid', '2023-11-12 12:35:02', '2024-05-28 17:22:48');
