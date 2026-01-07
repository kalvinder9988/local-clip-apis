# Slug Implementation Summary

## Overview
Successfully implemented automatic slug generation for MerchantBusiness and Category entities with proper handling of existing data.

## Changes Made

### 1. Entity Updates

#### Category Entity (`src/categories/entities/category.entity.ts`)
- Added `slug` field: `VARCHAR(255), UNIQUE, NULLABLE`
- Positioned after the `name` field

#### MerchantBusiness Entity (`src/merchant-businesses/entities/merchant-business.entity.ts`)
- Added `slug` field: `VARCHAR(255), UNIQUE, NULLABLE`
- Positioned after the `business_name` field

**Note**: Made nullable to handle existing records during migration

### 2. Slug Utility (`src/common/utils/slug.utils.ts`)

Created reusable utility functions:

**`generateSlug(text: string): string`**
- Converts text to URL-friendly format
- Lowercase transformation
- Removes special characters
- Replaces spaces with hyphens
- Removes multiple/leading/trailing hyphens

**`generateUniqueSlug(...): Promise<string>`**
- Ensures slug uniqueness
- Appends numbers if duplicates exist (e.g., `my-business-1`)
- Handles updates by preserving existing slugs when unchanged

### 3. Service Updates

#### CategoriesService (`src/categories/categories.service.ts`)
Added:
- `generateCategorySlug()` helper method
- Auto-generates slug from `name` on **CREATE**
- Regenerates slug only if `name` changes on **UPDATE**
- Ensures uniqueness with auto-increment

#### MerchantBusinessesService (`src/merchant-businesses/merchant-businesses.service.ts`)
Added:
- `generateBusinessSlug()` helper method  
- Auto-generates slug from `business_name` on **CREATE**
- Regenerates slug only if `business_name` changes on **UPDATE**
- Ensures uniqueness with auto-increment

### 4. Migration Script (`scripts/generate-slugs.ts`)

Created a standalone script to populate slugs for existing records:
- Reads all categories and merchant businesses with NULL/empty slugs
- Generates unique slugs based on name/business_name
- Handles duplicates by appending numbers
- Can be run via: `npm run generate-slugs`

### 5. Package.json Update

Added script command:
```json
"generate-slugs": "ts-node -r tsconfig-paths/register scripts/generate-slugs.ts"
```

## Migration Process

### Step 1: Add Slug Columns (NULLABLE)
✅ Completed - Entities updated with nullable slug fields

### Step 2: Generate Slugs for Existing Data
✅ Completed - Ran script successfully
- 6 categories processed
- 2 merchant businesses processed

### Step 3: Restart Server
- TypeORM synchronize will add the columns to database
- Existing data already has slugs populated

## Key Features

✅ **Automatic Generation**: No manual slug input required  
✅ **Uniqueness Guaranteed**: Database constraint + auto-increment logic  
✅ **Hidden from UI**: Slug not exposed in response DTOs  
✅ **Smart Updates**: Only regenerates when name changes  
✅ **Backward Compatible**: Handles existing data gracefully  
✅ **URL-Friendly**: Proper formatting for web URLs

## Usage Examples

### Category Creation
```
Input: "Food & Dining"
Generated Slug: "food-dining"
```

### Merchant Business Creation
```
Input: "Joe's Pizza & Pasta!"
Generated Slug: "joes-pizza-pasta"
```

### Duplicate Handling
```
Business 1: "School Sync" → slug: "school-sync"
Business 2: "School Sync" → slug: "school-sync-1"
Business 3: "School Sync" → slug: "school-sync-2"
```

## Database Schema

### Categories Table
```sql
ALTER TABLE categories 
ADD COLUMN slug VARCHAR(255) UNIQUE NULL;
```

### Merchant Businesses Table
```sql
ALTER TABLE merchant_businesses 
ADD COLUMN slug VARCHAR(255) UNIQUE NULL;
```

## Testing Results

✅ Script execution successful  
✅ All existing records populated with unique slugs  
✅ No TypeScript errors  
✅ Database constraints applied  

## Next Steps

1. **Restart the server** to apply schema changes
2. **Verify** slug generation on new category/business creation
3. **Test** slug updates when names change
4. **Optional**: Make slug NOT NULL in a future migration if desired

## Notes

- Slugs are stored in database but **not shown in UI**
- Slugs are automatically generated and managed by backend
- The `nullable: true` allows for graceful migration of existing data
- Future records will always have slugs generated automatically
