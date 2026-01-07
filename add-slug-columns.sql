-- Migration to add slug columns to merchant_businesses and categories tables

-- Add slug column to categories table
ALTER TABLE categories 
ADD COLUMN slug VARCHAR(255);

-- Generate slugs for existing categories
UPDATE categories 
SET slug = LOWER(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s-]', '', 'g'),
        '\\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
)
WHERE slug IS NULL;

-- Make slug unique after generating
ALTER TABLE categories 
ADD CONSTRAINT categories_slug_unique UNIQUE (slug);

-- Add slug column to merchant_businesses table
ALTER TABLE merchant_businesses 
ADD COLUMN slug VARCHAR(255);

-- Generate slugs for existing merchant businesses
UPDATE merchant_businesses 
SET slug = LOWER(
  TRIM(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\\s-]', '', 'g'),
        '\\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  )
)
WHERE slug IS NULL;

-- Handle duplicate slugs by appending a number
DO $$
DECLARE
  rec RECORD;
  counter INTEGER;
  new_slug VARCHAR(255);
BEGIN
  FOR rec IN 
    SELECT id, slug, business_name
    FROM merchant_businesses
    WHERE slug IN (
      SELECT slug 
      FROM merchant_businesses 
      WHERE slug IS NOT NULL
      GROUP BY slug 
      HAVING COUNT(*) > 1
    )
    ORDER BY id
  LOOP
    counter := 1;
    new_slug := rec.slug;
    
    WHILE EXISTS (SELECT 1 FROM merchant_businesses WHERE slug = new_slug AND id != rec.id) LOOP
      new_slug := rec.slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    IF new_slug != rec.slug THEN
      UPDATE merchant_businesses SET slug = new_slug WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- Handle duplicate category slugs by appending a number
DO $$
DECLARE
  rec RECORD;
  counter INTEGER;
  new_slug VARCHAR(255);
BEGIN
  FOR rec IN 
    SELECT id, slug, name
    FROM categories
    WHERE slug IN (
      SELECT slug 
      FROM categories 
      WHERE slug IS NOT NULL
      GROUP BY slug 
      HAVING COUNT(*) > 1
    )
    ORDER BY id
  LOOP
    counter := 1;
    new_slug := rec.slug;
    
    WHILE EXISTS (SELECT 1 FROM categories WHERE slug = new_slug AND id != rec.id) LOOP
      new_slug := rec.slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    IF new_slug != rec.slug THEN
      UPDATE categories SET slug = new_slug WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;

-- Make slug unique after generating and handling duplicates
ALTER TABLE merchant_businesses 
ADD CONSTRAINT merchant_businesses_slug_unique UNIQUE (slug);

-- Make slug NOT NULL
ALTER TABLE categories 
ALTER COLUMN slug SET NOT NULL;

ALTER TABLE merchant_businesses 
ALTER COLUMN slug SET NOT NULL;
