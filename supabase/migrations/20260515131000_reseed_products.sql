-- Delete existing products and re-seed with corrected image URLs
delete from public.products;

insert into public.products (name, category, description, price, image_url) values
('Espresso',        'Coffee',      'Rich and bold single shot of espresso with a velvety crema on top', 2.50, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80'),
('Americano',       'Coffee',      'Espresso with hot water for a smooth, full-bodied taste', 3.00, 'https://images.unsplash.com/photo-1521302080334-4bebac2763a6?w=600&q=80'),
('Cappuccino',      'Coffee',      'Espresso with steamed milk and a thick layer of velvety foam', 4.00, 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600&q=80'),
('Latte',           'Coffee',      'Creamy espresso drink with silky steamed milk and light foam art', 4.50, 'https://images.unsplash.com/photo-1531441802565-2948024f1b22?w=600&q=80'),
('Flat White',      'Coffee',      'Velvety microfoam milk with a double ristretto espresso base', 4.75, 'https://images.unsplash.com/photo-1759259639485-5e11d60b81af?w=600&q=80'),
('Croissant',       'Pastries',    'Buttery, flaky French pastry baked fresh every morning', 3.50, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80'),
('Chocolate Donut', 'Pastries',    'Soft, pillowy donut dipped in rich chocolate glaze', 2.75, 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=600&q=80'),
('Blueberry Muffin','Pastries',    'Moist muffin loaded with fresh blueberries and a crumbly sugar top', 3.25, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600&q=80'),
('Cinnamon Roll',   'Pastries',    'Warm cinnamon roll with brown sugar filling and cream cheese frosting', 4.00, 'https://images.unsplash.com/photo-1756137948744-a26fe254a79f?w=600&q=80'),
('Cheesecake Slice','Pastries',    'Creamy New York-style cheesecake with a buttery graham cracker crust', 5.50, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80'),
('Iced Coffee',     'Cold Drinks', 'Chilled cold-brew coffee poured over ice with your choice of milk', 3.50, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80'),
('Matcha Latte',    'Cold Drinks', 'Premium ceremonial-grade matcha whisked with oat milk over ice', 5.00, 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=600&q=80'),
('Fresh Orange Juice','Cold Drinks','Freshly squeezed oranges for a bright, vitamin-packed morning boost', 4.50, 'https://images.unsplash.com/photo-1546173159-315724a31696?w=600&q=80'),
('Hot Chocolate',   'Hot Drinks',  'Belgian dark chocolate melted into steamed milk, topped with whipped cream', 3.75, 'https://images.unsplash.com/photo-1542990253-a781e04c0082?w=600&q=80'),
('Avocado Toast',   'Food',        'Smashed avocado on sourdough with cherry tomatoes, chili flakes and sea salt', 7.50, 'https://images.unsplash.com/photo-1628556820645-63ba5f90e6a2?w=600&q=80'),
('Club Sandwich',   'Food',        'Triple-decker with grilled chicken, bacon, lettuce, tomato and mayo on toasted bread', 9.00, 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=600&q=80');
