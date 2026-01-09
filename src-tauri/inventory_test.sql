
SELECT name FROM sqlite_master WHERE type='table';

    -- Query all items
SELECT * FROM inventory_items; 
SELECT * FROM inventory_history; 

SELECT id, typeof(id) FROM inventory_items;