-- Test businesses in Olifantsfontein / Clayville, 1666
-- Coordinates centred on ~-25.975, 28.215 (Olifantsfontein)

INSERT INTO businesses (name, category, location, address, whatsapp_number, open_time, close_time, inventory, price_range, verified) VALUES
(
    'Olly''s Spaza',
    'spaza',
    ST_SetSRID(ST_MakePoint(28.2150, -25.9720), 4326),
    '12 Brickfield Road, Olifantsfontein, 1666',
    '0831234567',
    '06:00',
    '20:00',
    ARRAY['Bread', 'Milk', 'Eggs', 'Chips', 'Cold Drinks', 'Airtime'],
    'R',
    true
),
(
    'Clayville Cuts',
    'hair_salon',
    ST_SetSRID(ST_MakePoint(28.2195, -25.9745), 4326),
    '5 Maple Road, Clayville Ext 4, 1666',
    '0832345678',
    '08:00',
    '18:00',
    ARRAY['Men cuts', 'Women cuts', 'Braiding', 'Relaxers', 'Colour'],
    'RR',
    true
),
(
    'Shine & Go Car Wash',
    'car_wash',
    ST_SetSRID(ST_MakePoint(28.2120, -25.9700), 4326),
    'R25 Olifantsfontein Road, Olifantsfontein, 1666',
    '0833456789',
    '07:00',
    '17:00',
    ARRAY['Full valet', 'Exterior wash', 'Interior vacuum', 'Engine clean', 'Polish'],
    'RR',
    true
),
(
    'Mama Zulu''s Kitchen',
    'food_vendor',
    ST_SetSRID(ST_MakePoint(28.2175, -25.9760), 4326),
    '88 John Vorster Drive, Clayville, 1666',
    '0834567890',
    '10:00',
    '20:00',
    ARRAY['Pap & Chicken', 'Vetkoek', 'Samp & Beans', 'Braai Chops', 'Soft Porridge'],
    'R',
    true
),
(
    'Fix It Fast',
    'phone_repair',
    ST_SetSRID(ST_MakePoint(28.2140, -25.9735), 4326),
    '3 Industrial Road, Clayville Ext 2, 1666',
    '0835678901',
    '09:00',
    '18:00',
    ARRAY['Screen replacement', 'Battery swap', 'Charging port', 'Speaker repair', 'Data recovery'],
    'RR',
    true
),
(
    'Threads & More',
    'tailor',
    ST_SetSRID(ST_MakePoint(28.2205, -25.9710), 4326),
    '21 Granite Street, Olifantsfontein, 1666',
    '0836789012',
    '08:00',
    '17:00',
    ARRAY['Alterations', 'School uniforms', 'Traditional wear', 'Dress making', 'Suit repairs'],
    'RR',
    true
),
(
    'Nando''s Spaza Express',
    'spaza',
    ST_SetSRID(ST_MakePoint(28.2160, -25.9780), 4326),
    '45 Clay Road, Clayville, 1666',
    '0837890123',
    '06:30',
    '21:00',
    ARRAY['Bread', 'Milk', 'Sugar', 'Cooldrinks', 'Sweets', 'Cigarettes', 'Paraffin'],
    'R',
    true
),
(
    'Quick Grill',
    'food_vendor',
    ST_SetSRID(ST_MakePoint(28.2130, -25.9755), 4326),
    'Corner Brickfield & Maple Road, Olifantsfontein, 1666',
    '0838901234',
    '11:00',
    '22:00',
    ARRAY['Boerewors roll', 'Chicken pieces', 'Chips', 'Magwinya', 'Cold drinks'],
    'R',
    true
)
ON CONFLICT DO NOTHING;

INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT id, '00000000-0000-0000-0000-000000000001', 5, 'Always open early, best spaza in the area!'
FROM businesses WHERE name = 'Olly''s Spaza'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT id, '00000000-0000-0000-0000-000000000001', 4, 'Clean salon, very professional. Book ahead on weekends.'
FROM businesses WHERE name = 'Clayville Cuts'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT id, '00000000-0000-0000-0000-000000000001', 5, 'Spotless job every time. Worth every rand.'
FROM businesses WHERE name = 'Shine & Go Car Wash'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT id, '00000000-0000-0000-0000-000000000001', 5, 'Best pap and chicken in Clayville, no debate.'
FROM businesses WHERE name = 'Mama Zulu''s Kitchen'
ON CONFLICT DO NOTHING;

UPDATE businesses SET rating = 5.0, total_reviews = 1 WHERE name = 'Olly''s Spaza';
UPDATE businesses SET rating = 4.0, total_reviews = 1 WHERE name = 'Clayville Cuts';
UPDATE businesses SET rating = 5.0, total_reviews = 1 WHERE name = 'Shine & Go Car Wash';
UPDATE businesses SET rating = 5.0, total_reviews = 1 WHERE name = 'Mama Zulu''s Kitchen';
