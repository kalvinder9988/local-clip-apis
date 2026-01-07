import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { generateSlug } from '../src/common/utils/slug.utils';

config();

const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'local_clip',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
});

async function generateUniqueSlugs() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        // Generate slugs for categories
        console.log('\n=== Processing Categories ===');
        const categories = await AppDataSource.query(
            'SELECT id, name, slug FROM categories WHERE slug IS NULL OR slug = ""'
        );

        for (const category of categories) {
            let baseSlug = generateSlug(category.name);
            let slug = baseSlug;
            let counter = 1;

            // Check for duplicates and append number if needed
            while (true) {
                const existing = await AppDataSource.query(
                    'SELECT id FROM categories WHERE slug = ? AND id != ?',
                    [slug, category.id]
                );

                if (existing.length === 0) {
                    break;
                }

                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            await AppDataSource.query(
                'UPDATE categories SET slug = ? WHERE id = ?',
                [slug, category.id]
            );

            console.log(`Category ${category.id} "${category.name}" -> slug: "${slug}"`);
        }

        // Generate slugs for merchant businesses
        console.log('\n=== Processing Merchant Businesses ===');
        const businesses = await AppDataSource.query(
            'SELECT id, business_name, slug FROM merchant_businesses WHERE slug IS NULL OR slug = ""'
        );

        for (const business of businesses) {
            let baseSlug = generateSlug(business.business_name);
            let slug = baseSlug;
            let counter = 1;

            // Check for duplicates and append number if needed
            while (true) {
                const existing = await AppDataSource.query(
                    'SELECT id FROM merchant_businesses WHERE slug = ? AND id != ?',
                    [slug, business.id]
                );

                if (existing.length === 0) {
                    break;
                }

                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            await AppDataSource.query(
                'UPDATE merchant_businesses SET slug = ? WHERE id = ?',
                [slug, business.id]
            );

            console.log(`Business ${business.id} "${business.business_name}" -> slug: "${slug}"`);
        }

        console.log('\n✅ Slug generation completed successfully!');

    } catch (error) {
        console.error('❌ Error generating slugs:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

generateUniqueSlugs();
