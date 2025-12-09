-- Seed some mock properties for testing
INSERT INTO properties (mls_id, address, city, state, zip, price, beds, baths, sqft, status, description) VALUES
  ('MLS-001', '123 Main St', 'McKinney', 'TX', '75070', 450000, 4, 3, 2400, 'active', 'Beautiful single-family home in a quiet neighborhood.'),
  ('MLS-002', '456 Oak Ave', 'McKinney', 'TX', '75071', 375000, 3, 2, 1800, 'active', 'Charming home with updated kitchen and large backyard.'),
  ('MLS-003', '789 Elm Dr', 'Frisco', 'TX', '75034', 525000, 5, 4, 3200, 'active', 'Spacious family home with pool and three-car garage.'),
  ('MLS-004', '321 Pine Ln', 'Allen', 'TX', '75002', 320000, 3, 2, 1600, 'active', 'Move-in ready starter home near top-rated schools.'),
  ('MLS-005', '654 Maple Ct', 'Plano', 'TX', '75024', 680000, 5, 4, 3800, 'pending', 'Luxury home in gated community with resort-style amenities.'),
  ('MLS-006', '987 Cedar Blvd', 'McKinney', 'TX', '75070', 290000, 2, 2, 1200, 'active', 'Cozy townhome perfect for first-time buyers.'),
  ('MLS-007', '147 Birch Way', 'Prosper', 'TX', '75078', 720000, 6, 5, 4200, 'active', 'New construction with premium finishes throughout.'),
  ('MLS-008', '258 Willow St', 'McKinney', 'TX', '75071', 410000, 4, 3, 2200, 'sold', 'Recently renovated with modern open floor plan.'),
  ('MLS-009', '369 Spruce Rd', 'Frisco', 'TX', '75035', 490000, 4, 3, 2600, 'active', 'Corner lot with mature trees and updated bathrooms.'),
  ('MLS-010', '741 Aspen Pl', 'Allen', 'TX', '75013', 350000, 3, 2, 1700, 'active', 'Well-maintained home with new roof and HVAC.')
ON CONFLICT (mls_id) DO NOTHING;
