-- ============================================================
-- PRODUCT SEED DATA
-- Removes all existing products and product_images, then inserts
-- 40 fresh products (8 per category) with images and variants.
--
-- Categories:
--   1 = Electronics
--   2 = Fashion
--   3 = Home & Garden
--   4 = Beauty
--   5 = Sports
--
-- Seller used: seller_id = 1 (Tech Gadgets Store, approved)
-- Run this against your live database.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. Clean up dependent tables first
-- ------------------------------------------------------------
DELETE FROM `cart`        WHERE `product_id` IN (SELECT `id` FROM `products`);
DELETE FROM `wishlist`    WHERE `product_id` IN (SELECT `id` FROM `products`);
DELETE FROM `reviews`     WHERE `product_id` IN (SELECT `id` FROM `products`);
DELETE FROM `order_items` WHERE `product_id` IN (SELECT `id` FROM `products`);
DELETE FROM `product_images`;
DELETE FROM `products`;

-- Reset auto-increment so IDs start cleanly from 1
ALTER TABLE `product_images` AUTO_INCREMENT = 1;
ALTER TABLE `products`       AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 2. PRODUCTS
-- ============================================================

INSERT INTO `products`
  (`id`, `seller_id`, `category_id`, `name`, `description`, `price`, `discount_price`, `stock`, `status`, `variants`, `created_at`)
VALUES

-- ----------------------------------------------------------
-- ELECTRONICS (category_id = 1)  IDs 1-8
-- ----------------------------------------------------------
(1,  1, 1, 'Samsung Galaxy S24 Ultra',
 'The ultimate Android flagship featuring a 200MP camera, built-in S Pen, Snapdragon 8 Gen 3 processor, 5000 mAh battery, and a stunning 6.8" Dynamic AMOLED 2X display at 120Hz. Available in Titanium Black, Titanium Gray, Titanium Violet and Titanium Yellow.',
 1499.99, 1299.99, 40, 'active',
 '[{"name":"Titanium Black","has_image":false},{"name":"Titanium Gray","has_image":false},{"name":"Titanium Violet","has_image":false}]',
 NOW()),

(2,  1, 1, 'Apple MacBook Pro 14"',
 'Powered by the Apple M3 Pro chip with a 12-core CPU and 18-core GPU, this MacBook Pro delivers extraordinary performance in a sleek aluminium body. Features a 14.2" Liquid Retina XDR display, 18 GB unified memory, 512 GB SSD, and up to 18 hours battery life.',
 1999.99, 1799.99, 25, 'active',
 '[{"name":"Space Black","has_image":false},{"name":"Silver","has_image":false}]',
 NOW()),

(3,  1, 1, 'Sony WH-1000XM5 Headphones',
 'Industry-leading noise cancelling headphones with two processors and eight microphones. Enjoy up to 30 hours of battery life, multipoint connection (pair with two devices simultaneously), and crystal-clear hands-free calling. Ultra-comfortable over-ear design with premium padded ear cups.',
 399.99, 329.99, 80, 'active',
 '[{"name":"Black","has_image":false},{"name":"Platinum Silver","has_image":false}]',
 NOW()),

(4,  1, 1, 'iPad Pro 12.9" M2',
 'The most advanced iPad ever. Features the breakthrough M2 chip, a breathtaking 12.9" Liquid Retina XDR display with ProMotion 120Hz, four-speaker audio, and support for Apple Pencil (2nd gen) and the Magic Keyboard. With USB-C Thunderbolt, connect to high-speed accessories and displays.',
 1099.99, NULL, 30, 'active',
 '[{"name":"Space Gray","has_image":false},{"name":"Silver","has_image":false}]',
 NOW()),

(5,  1, 1, 'Logitech MX Master 3S Mouse',
 'The MX Master 3S is the most advanced Master Series mouse. Featuring an 8000 DPI high-precision sensor that tracks on glass, near-silent clicks, and the MagSpeed electromagnetic scrolling wheel that scrolls 1000 lines per second. Works wirelessly via Bluetooth or USB receiver.',
 99.99, 79.99, 120, 'active',
 '[{"name":"Graphite","has_image":false},{"name":"Pale Grey","has_image":false}]',
 NOW()),

(6,  1, 1, 'Samsung 55" 4K QLED Smart TV',
 'Experience quantum colour accuracy with Samsung\'s QLED technology. This 55-inch smart TV offers 4K UHD resolution, HDR10+, a 120Hz refresh rate, built-in Alexa and Google Assistant, and 4 HDMI ports. The slim Infinity design blends seamlessly into any living room.',
 899.99, 749.99, 15, 'active',
 NULL,
 NOW()),

(7,  1, 1, 'Anker 65W USB-C Charger',
 'Charge your laptop, tablet and phone simultaneously with this compact 65W GaN III charger. Features three ports (2× USB-C, 1× USB-A), PowerIQ 4.0 fast charging, foldable plug, and ActiveShield 2.0 temperature monitoring. Compatible with MacBook, iPad, Galaxy, iPhone and more.',
 49.99, 39.99, 200, 'active',
 NULL,
 NOW()),

(8,  1, 1, 'DJI Mini 4 Pro Drone',
 'Weighing under 249g, the DJI Mini 4 Pro requires no registration in most countries yet delivers pro-grade aerial footage. Shoots 4K/60fps video with a 1/1.3" CMOS sensor, omnidirectional obstacle sensing, 34-minute flight time, and 20km transmission range.',
 759.99, 699.99, 20, 'active',
 '[{"name":"Standard","has_image":false},{"name":"Fly More Combo","has_image":false}]',
 NOW()),

-- ----------------------------------------------------------
-- FASHION (category_id = 2)  IDs 9-16
-- ----------------------------------------------------------
(9,  1, 2, 'Classic Slim-Fit Denim Jacket',
 'A wardrobe essential crafted from premium 12-oz selvedge denim. Features a tailored slim fit, two chest pockets, adjustable button cuffs, and contrast stitching. Pairs perfectly with casual or smart-casual outfits. Available in Indigo Blue and Washed Black.',
 129.99, 99.99, 60, 'active',
 '[{"name":"Indigo Blue","has_image":false},{"name":"Washed Black","has_image":false}]',
 NOW()),

(10, 1, 2, 'Leather Bifold Wallet',
 'Hand-stitched from full-grain vegetable-tanned leather, this slim bifold wallet holds up to 8 cards, has two cash compartments, and an ID window. RFID-blocking lining protects your cards from electronic theft. Available in Cognac Brown, Midnight Black and Tan.',
 59.99, 49.99, 150, 'active',
 '[{"name":"Cognac Brown","has_image":false},{"name":"Midnight Black","has_image":false},{"name":"Tan","has_image":false}]',
 NOW()),

(11, 1, 2, 'Cashmere Turtleneck Sweater',
 'Pure Grade-A Mongolian cashmere in a relaxed turtleneck silhouette. Incredibly soft, warm and lightweight, this luxurious sweater features a ribbed collar, cuffs and hem. Dry clean only. Available in Ivory, Camel, Navy and Charcoal.',
 249.99, 199.99, 45, 'active',
 '[{"name":"Ivory","has_image":false},{"name":"Camel","has_image":false},{"name":"Navy","has_image":false},{"name":"Charcoal","has_image":false}]',
 NOW()),

(12, 1, 2, 'Silk Floral Wrap Dress',
 'Flowing 100% mulberry silk wrap dress with a hand-painted floral print. Features a V-neckline, adjustable tie waist, flutter sleeves, and a midi-length skirt. Lined throughout. Perfect for brunch, weddings or garden parties. Available in Rose Garden and Midnight Bloom prints.',
 189.99, 159.99, 35, 'active',
 '[{"name":"Rose Garden","has_image":false},{"name":"Midnight Bloom","has_image":false}]',
 NOW()),

(13, 1, 2, 'Ray-Ban Aviator Classic Sunglasses',
 'The iconic Ray-Ban Aviator with crystal lenses that provide 100% UV protection and reduce glare. Lightweight gold metal frame with a teardrop-shaped lens. Comes with a Ray-Ban case and cleaning cloth. Available in Gold/G-15 Green, Gold/B-15 Brown and Silver/Crystal Grey.',
 154.99, NULL, 90, 'active',
 '[{"name":"Gold/G-15 Green","has_image":false},{"name":"Gold/B-15 Brown","has_image":false},{"name":"Silver/Crystal Grey","has_image":false}]',
 NOW()),

(14, 1, 2, 'Structured Leather Tote Bag',
 'A sophisticated tote crafted from pebbled Italian leather. Features a roomy main compartment with a magnetic snap closure, a zip interior pocket, two open slip pockets, and a detachable zip pouch. Adjustable shoulder strap included. Available in Caramel, Black and Burgundy.',
 349.99, 299.99, 25, 'active',
 '[{"name":"Caramel","has_image":false},{"name":"Black","has_image":false},{"name":"Burgundy","has_image":false}]',
 NOW()),

(15, 1, 2, 'Merino Wool Plaid Scarf',
 'Super-soft 100% extra-fine Merino wool scarf in a classic plaid pattern. 180×30 cm — generous enough for multiple wrapping styles. Naturally temperature-regulating, moisture-wicking and odour-resistant. Machine washable on gentle cycle. Available in Navy Plaid and Red Tartan.',
 79.99, 64.99, 110, 'active',
 '[{"name":"Navy Plaid","has_image":false},{"name":"Red Tartan","has_image":false}]',
 NOW()),

(16, 1, 2, 'Nike Air Force 1 Sneakers',
 'The timeless Nike Air Force 1 Low in premium leather. Features a durable rubber sole, Air-Sole unit in the heel for lightweight cushioning, metal dubrae and foam midsole for all-day comfort. The sneaker that started a movement. Available in White/White and Black/Black.',
 109.99, NULL, 75, 'active',
 '[{"name":"White/White","has_image":false},{"name":"Black/Black","has_image":false}]',
 NOW()),

-- ----------------------------------------------------------
-- HOME & GARDEN (category_id = 3)  IDs 17-24
-- ----------------------------------------------------------
(17, 1, 3, 'Dyson V15 Detect Cordless Vacuum',
 'The most powerful, most intelligent cordless vacuum. A laser reveals microscopic dust on hard floors, while the particle-counting piezo sensor auto-adapts suction to tackle the heaviest loads. Includes a Fluffy Optic cleaner head, Hair screw tool and up to 60 minutes of fade-free power.',
 699.99, 599.99, 18, 'active',
 NULL,
 NOW()),

(18, 1, 3, 'Instant Pot Duo 7-in-1 (6 Qt)',
 'Replace 7 kitchen appliances with one: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yoghurt maker and warmer. 13 built-in smart programmes, easy-seal lid, stainless-steel inner pot and dishwasher-safe parts. Cooks up to 70% faster than conventional methods.',
 89.99, 74.99, 55, 'active',
 NULL,
 NOW()),

(19, 1, 3, 'Philips Hue White & Color Starter Kit',
 'Transform your home with 16 million colours and shades of white. This starter kit includes three A19 smart bulbs and the Hue Bridge. Control via the Hue app, Alexa, Google Home or Apple HomeKit. Set scenes, schedules and routines. Works with all standard E26/E27 sockets.',
 199.99, 169.99, 40, 'active',
 NULL,
 NOW()),

(20, 1, 3, 'Bosch Cordless Drill Driver (18V)',
 'Professional-grade Bosch GSR 18V-55 drill driver with 55 Nm torque, 2-speed gearbox and electronic motor protection. Includes two 2.0 Ah batteries, fast charger, 13mm metal keyless chuck and a carry case. Ideal for DIY and light professional use.',
 189.99, 159.99, 30, 'active',
 NULL,
 NOW()),

(21, 1, 3, 'Fiskars Solid Garden Tool Set (3-Piece)',
 'Premium garden tool set comprising a digging spade, transplanting trowel and weeder. Forged carbon-steel heads are shock-tested to 350 kg. FiberComp handles absorb vibration and resist weather. Ergonomic non-slip grips reduce hand fatigue. Lifetime warranty.',
 74.99, NULL, 65, 'active',
 NULL,
 NOW()),

(22, 1, 3, 'Karcher K4 Power Control Pressure Washer',
 'Efficiently clean patios, cars, bicycles and garden furniture. The K4 delivers 130 bar / 420 L/h with a Home Kit including a DirtBlaster rotary spray wand and a 3-in-1 Vario Power spray wand. Integrated water-cooled motor for longer runtimes and the Plug \'n\' Clean detergent system.',
 299.99, 249.99, 12, 'active',
 NULL,
 NOW()),

(23, 1, 3, 'Solar-Powered LED Garden Lights (8-Pack)',
 'Illuminate pathways, borders and flower beds with zero running costs. Each stake light features a 600 mAh NiMH battery charged by the monocrystalline solar panel during the day. Auto on/off via light sensor. IP65 waterproof rated. Warm-white 3000K LEDs.',
 39.99, 29.99, 200, 'active',
 NULL,
 NOW()),

(24, 1, 3, 'Cast Iron Dutch Oven 5.5 Qt',
 'An heirloom-quality enamelled cast-iron Dutch oven perfect for slow braises, soups, stews and bread baking. The tight-fitting lid circulates steam to keep food moist. Oven-safe to 260°C, compatible with all hob types including induction. Available in Flame Orange and Marseille Blue.',
 149.99, 119.99, 35, 'active',
 '[{"name":"Flame Orange","has_image":false},{"name":"Marseille Blue","has_image":false}]',
 NOW()),

-- ----------------------------------------------------------
-- BEAUTY (category_id = 4)  IDs 25-32
-- ----------------------------------------------------------
(25, 1, 4, 'La Mer Moisturising Cream 60ml',
 'The legendary Crème de la Mer formulated with the renewing Miracle Broth™ — a living elixir of fermented sea kelp, vitamins, minerals and amino acids. This rich, enveloping cream soothes and heals dry skin, visibly reduces fine lines and leaves the complexion radiant.',
 199.99, NULL, 50, 'active',
 NULL,
 NOW()),

(26, 1, 4, 'Charlotte Tilbury Pillow Talk Lip Kit',
 'The most iconic lip duo in the world. Includes the Matte Revolution Lipstick in Pillow Talk (a universally flattering nude-pink) and the Lip Cheat lip liner to define, shape and prevent feathering. Long-wearing formula with moisturising Hyaluronic Acid complex.',
 59.99, 49.99, 120, 'active',
 NULL,
 NOW()),

(27, 1, 4, 'Dyson Airwrap Multi-Styler Complete',
 'The Dyson Airwrap uses the Coanda effect to attract and wrap hair around the barrel — no extreme heat required. The Complete edition includes barrels for curls and waves, a smoothing brush, a volumising brush and a firm smoothing brush. Works on all hair types.',
 599.99, 549.99, 22, 'active',
 '[{"name":"Prussian Blue/Rich Copper","has_image":false},{"name":"Nickel/Copper","has_image":false}]',
 NOW()),

(28, 1, 4, 'DIOR Sauvage Eau de Parfum 100ml',
 'A radically fresh composition that contrasts the freshness of bergamot with a spicy, musky base. The Eau de Parfum version is deeper and more enveloping — a powerful masculine fragrance built around a star ingredient: Ambroxan, derived from ambergris.',
 149.99, NULL, 75, 'active',
 '[{"name":"100ml","has_image":false},{"name":"60ml","has_image":false},{"name":"30ml","has_image":false}]',
 NOW()),

(29, 1, 4, 'The Ordinary AHA 30% + BHA 2% Peeling Solution',
 'A 10-minute exfoliating facial with 30% Alpha Hydroxy Acids and 2% Beta Hydroxy Acid to fight visible blemishes and improve skin texture. Contains Tasmanian pepperberry to reduce irritation. Not for sensitive skin; patch test recommended. For experienced AHA/BHA users only.',
 9.99, NULL, 300, 'active',
 NULL,
 NOW()),

(30, 1, 4, 'Kerastase Nutritive Shampoo & Mask Set',
 'Professional-grade nourishment for dry hair. The Bain Satin shampoo with irisome complex gently cleanses while restoring nutrition and softness. The Masquintense mask intensely conditions, leaving hair silky, weightless and brilliantly shiny. Suitable for fine to medium dry hair.',
 64.99, 54.99, 85, 'active',
 NULL,
 NOW()),

(31, 1, 4, 'MAC Studio Fix Fluid Foundation SPF 15',
 'Full coverage, matte-finish foundation with broad-spectrum SPF 15. Lightweight, long-wearing formula that controls shine all day and resists sweat and humidity. Available in 60+ shades across 6 undertone families. Dermatologist-tested, suitable for all skin types.',
 39.99, NULL, 140, 'active',
 '[{"name":"NC15","has_image":false},{"name":"NC25","has_image":false},{"name":"NC35","has_image":false},{"name":"NC45","has_image":false}]',
 NOW()),

(32, 1, 4, 'Neutrogena Hydro Boost Water Gel Moisturiser',
 'Clinically tested gel-cream moisturiser with hyaluronic acid that locks in moisture and continuously releases it throughout the day. Absorbs instantly, leaves skin supple, smooth and hydrated for 48 hours. Oil-free, non-comedogenic and fragrance-free. Suitable for sensitive skin.',
 24.99, 19.99, 250, 'active',
 NULL,
 NOW()),

-- ----------------------------------------------------------
-- SPORTS (category_id = 5)  IDs 33-40
-- ----------------------------------------------------------
(33, 1, 5, 'Garmin Forerunner 265 GPS Watch',
 'An advanced running smartwatch with AMOLED display, multi-band GPS, HRV status, race widget predictor and up to 15 days battery life in smartwatch mode. Tracks running dynamics, VO2 max, recovery time and daily suggested workouts. Water-rated to 5 ATM.',
 449.99, 399.99, 28, 'active',
 '[{"name":"Black/Powder Gray","has_image":false},{"name":"Aqua/Light Blue","has_image":false}]',
 NOW()),

(34, 1, 5, 'Adidas Ultraboost 23 Running Shoes',
 'Engineered for energy return in every stride. The Ultraboost 23 features a full-length BOOST midsole for supreme cushioning, a Linear Energy Push system for propulsion, Primeknit+ upper for a sock-like fit, and a Continental™ rubber outsole for exceptional grip on wet surfaces.',
 189.99, 159.99, 65, 'active',
 '[{"name":"Core Black","has_image":false},{"name":"Cloud White","has_image":false},{"name":"Wonder Steel","has_image":false}]',
 NOW()),

(35, 1, 5, 'Bowflex SelectTech 552 Dumbbells (Pair)',
 'Two dumbbells in one compact design. Adjust from 2.3 kg to 23.6 kg in 2.3 kg increments with a simple turn of the dial. Replaces 15 sets of traditional dumbbells. Moulded seats protect the weight plates and keep them neatly stored when not in use.',
 349.99, 299.99, 15, 'active',
 NULL,
 NOW()),

(36, 1, 5, 'Wilson Pro Staff 97 V14 Tennis Racket',
 'The refined Wilson Pro Staff 97 V14 is the choice of tennis legend Roger Federer. Features a 97 sq. in. head size, Fortyfive° layup for precision feel, and Carbon Mapping technology that creates a denser sweet spot. String pattern 16×19 for enhanced spin.',
 229.99, 199.99, 40, 'active',
 NULL,
 NOW()),

(37, 1, 5, 'Lululemon Align High-Rise Leggings',
 'These buttery-soft leggings are made with Nulu™ fabric — so weightless you barely feel them. Designed for yoga and low-impact workouts, they have a high-rise 7/8 length, four-way stretch and a hidden waistband pocket. Available in 20+ colours.',
 118.00, 98.00, 90, 'active',
 '[{"name":"Black","has_image":false},{"name":"Bone","has_image":false},{"name":"Sage Green","has_image":false}]',
 NOW()),

(38, 1, 5, 'Coleman Sundome 4-Person Camping Tent',
 'Easy setup in 10 minutes, the Sundome 4-Person tent features a WeatherTec system with patented corner welds and inverted seams that prevent water from seeping inside. Continuous pole sleeves add strength and stability. Large windows and a ground vent keep you cool.',
 99.99, 84.99, 30, 'active',
 NULL,
 NOW()),

(39, 1, 5, 'Manduka PRO Yoga Mat',
 'Used by yoga teachers worldwide, the Manduka PRO is made from eco-certified PVC foam with a closed-cell surface that never absorbs moisture. 6mm dense cushioning protects joints. The textured surface provides superior grip, dry or sweaty. Lifetime guarantee.',
 120.00, NULL, 55, 'active',
 '[{"name":"Black","has_image":false},{"name":"Pacific Blue","has_image":false}]',
 NOW()),

(40, 1, 5, 'Everlast Pro Style Boxing Gloves',
 'Classic Everlast training gloves built for heavy bag work, pad work and sparring. EverCool™ thumb and palm mesh panels keep hands dry; EverFoam™ triple-layer padding absorbs hard shots. Velcro wrist strap for a secure fit. Available in 8oz, 10oz, 12oz and 16oz.',
 49.99, 39.99, 100, 'active',
 '[{"name":"8oz","has_image":false},{"name":"10oz","has_image":false},{"name":"12oz","has_image":false},{"name":"16oz","has_image":false}]',
 NOW());


-- ============================================================
-- 3. PRODUCT IMAGES  (4 images per product, first is main)
--    Images are category-relevant Unsplash photos.
-- ============================================================

INSERT INTO `product_images` (`product_id`, `image_url`, `is_main`) VALUES

-- ---- Electronics ----
-- 1: Samsung Galaxy S24 Ultra
(1, 'https://images.unsplash.com/photo-1610945264803-c22b62831e5b?w=800', 1),
(1, 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800', 0),
(1, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800', 0),
(1, 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800', 0),

-- 2: MacBook Pro
(2, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800', 1),
(2, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800', 0),
(2, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800', 0),
(2, 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800', 0),

-- 3: Sony WH-1000XM5 Headphones
(3, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 1),
(3, 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800', 0),
(3, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800', 0),
(3, 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800', 0),

-- 4: iPad Pro
(4, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800', 1),
(4, 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800', 0),
(4, 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800', 0),
(4, 'https://images.unsplash.com/photo-1588702547919-26089e690ecc?w=800', 0),

-- 5: Logitech MX Master 3S
(5, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', 1),
(5, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800', 0),
(5, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800', 0),
(5, 'https://images.unsplash.com/photo-1608022702096-b90a47d7bed0?w=800', 0),

-- 6: Samsung 55" QLED TV
(6, 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=800', 1),
(6, 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800', 0),
(6, 'https://images.unsplash.com/photo-1619975003880-e2bcd2a3b5b8?w=800', 0),
(6, 'https://images.unsplash.com/photo-1571415060716-baff5f717c12?w=800', 0),

-- 7: Anker 65W Charger
(7, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800', 1),
(7, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 0),
(7, 'https://images.unsplash.com/photo-1631867675167-90a456a90863?w=800', 0),
(7, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800', 0),

-- 8: DJI Mini 4 Pro
(8, 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800', 1),
(8, 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800', 0),
(8, 'https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=800', 0),
(8, 'https://images.unsplash.com/photo-1559561853-08451507cbe7?w=800', 0),

-- ---- Fashion ----
-- 9: Denim Jacket
(9, 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800', 1),
(9, 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800', 0),
(9, 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800', 0),
(9, 'https://images.unsplash.com/photo-1611042553484-d61f84d22784?w=800', 0),

-- 10: Leather Wallet
(10, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800', 1),
(10, 'https://images.unsplash.com/photo-1604716350874-e11d97ea7513?w=800', 0),
(10, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800', 0),
(10, 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800', 0),

-- 11: Cashmere Sweater
(11, 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800', 1),
(11, 'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800', 0),
(11, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800', 0),
(11, 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800', 0),

-- 12: Silk Wrap Dress
(12, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800', 1),
(12, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800', 0),
(12, 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800', 0),
(12, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800', 0),

-- 13: Ray-Ban Aviator
(13, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800', 1),
(13, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800', 0),
(13, 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800', 0),
(13, 'https://images.unsplash.com/photo-1494253109108-2e30c049369b?w=800', 0),

-- 14: Leather Tote Bag
(14, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800', 1),
(14, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 0),
(14, 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800', 0),
(14, 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800', 0),

-- 15: Merino Scarf
(15, 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800', 1),
(15, 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', 0),
(15, 'https://images.unsplash.com/photo-1601925228240-7e68ea6c7c6e?w=800', 0),
(15, 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800', 0),

-- 16: Nike Air Force 1
(16, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 1),
(16, 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', 0),
(16, 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800', 0),
(16, 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800', 0),

-- ---- Home & Garden ----
-- 17: Dyson V15
(17, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1),
(17, 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=800', 0),
(17, 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800', 0),
(17, 'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=800', 0),

-- 18: Instant Pot
(18, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 1),
(18, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', 0),
(18, 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800', 0),
(18, 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800', 0),

-- 19: Philips Hue
(19, 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=800', 1),
(19, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800', 0),
(19, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800', 0),
(19, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 0),

-- 20: Bosch Drill
(20, 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', 1),
(20, 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800', 0),
(20, 'https://images.unsplash.com/photo-1581147036324-c47a03a81d48?w=800', 0),
(20, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800', 0),

-- 21: Fiskars Garden Tool Set
(21, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', 1),
(21, 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800', 0),
(21, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800', 0),
(21, 'https://images.unsplash.com/photo-1599629954294-14df9dfc4a01?w=800', 0),

-- 22: Karcher Pressure Washer
(22, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 1),
(22, 'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=800', 0),
(22, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', 0),
(22, 'https://images.unsplash.com/photo-1565224900-91474a0efa7c?w=800', 0),

-- 23: Solar Garden Lights
(23, 'https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800', 1),
(23, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800', 0),
(23, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800', 0),
(23, 'https://images.unsplash.com/photo-1499988921418-b7df40ff03f9?w=800', 0),

-- 24: Cast Iron Dutch Oven
(24, 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800', 1),
(24, 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', 0),
(24, 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800', 0),
(24, 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=800', 0),

-- ---- Beauty ----
-- 25: La Mer Moisturising Cream
(25, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 1),
(25, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 0),
(25, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 0),
(25, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 0),

-- 26: Charlotte Tilbury Lip Kit
(26, 'https://images.unsplash.com/photo-1586495777744-4e6232bf4628?w=800', 1),
(26, 'https://images.unsplash.com/photo-1519415387722-a1c3bbef716c?w=800', 0),
(26, 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', 0),
(26, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', 0),

-- 27: Dyson Airwrap
(27, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', 1),
(27, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800', 0),
(27, 'https://images.unsplash.com/photo-1620756236308-65c3ef5d25f3?w=800', 0),
(27, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', 0),

-- 28: Dior Sauvage EDP
(28, 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=800', 1),
(28, 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800', 0),
(28, 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800', 0),
(28, 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800', 0),

-- 29: The Ordinary Peeling Solution
(29, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 1),
(29, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 0),
(29, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 0),
(29, 'https://images.unsplash.com/photo-1599305090598-fe179d501227?w=800', 0),

-- 30: Kerastase Shampoo & Mask Set
(30, 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800', 1),
(30, 'https://images.unsplash.com/photo-1526045612212-70caf35c14df?w=800', 0),
(30, 'https://images.unsplash.com/photo-1585232351009-aa87416fca55?w=800', 0),
(30, 'https://images.unsplash.com/photo-1625631253613-53bc94fa1e82?w=800', 0),

-- 31: MAC Studio Fix Foundation
(31, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800', 1),
(31, 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800', 0),
(31, 'https://images.unsplash.com/photo-1586495777744-4e6232bf4628?w=800', 0),
(31, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 0),

-- 32: Neutrogena Hydro Boost
(32, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800', 1),
(32, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800', 0),
(32, 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800', 0),
(32, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800', 0),

-- ---- Sports ----
-- 33: Garmin Forerunner 265
(33, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800', 1),
(33, 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800', 0),
(33, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800', 0),
(33, 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800', 0),

-- 34: Adidas Ultraboost 23
(34, 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800', 1),
(34, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', 0),
(34, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800', 0),
(34, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800', 0),

-- 35: Bowflex SelectTech Dumbbells
(35, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 1),
(35, 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800', 0),
(35, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 0),
(35, 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800', 0),

-- 36: Wilson Tennis Racket
(36, 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800', 1),
(36, 'https://images.unsplash.com/photo-1530915534664-4ac6423a5b08?w=800', 0),
(36, 'https://images.unsplash.com/photo-1551958219-acbc595d916f?w=800', 0),
(36, 'https://images.unsplash.com/photo-1617083934555-ac63e2d7c3e8?w=800', 0),

-- 37: Lululemon Align Leggings
(37, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', 1),
(37, 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800', 0),
(37, 'https://images.unsplash.com/photo-1562886812-a634082b6a8c?w=800', 0),
(37, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 0),

-- 38: Coleman Camping Tent
(38, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800', 1),
(38, 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800', 0),
(38, 'https://images.unsplash.com/photo-1537565266759-34e4f0c5a082?w=800', 0),
(38, 'https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800', 0),

-- 39: Manduka PRO Yoga Mat
(39, 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800', 1),
(39, 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800', 0),
(39, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800', 0),
(39, 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800', 0),

-- 40: Everlast Boxing Gloves
(40, 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800', 1),
(40, 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800', 0),
(40, 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=800', 0),
(40, 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800', 0);

-- ============================================================
-- Done. 40 products inserted (8 per category) with 4 images
-- each (160 image rows total).
-- ============================================================
