require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

/**
 * Test script to verify that email templates are properly loaded
 */
async function testTemplates() {
    try {
        console.log('Testing Email Templates...');

        const templatesDir = path.join(__dirname, '../templates/emails');
        const templates = ['verification.html', 'password-reset.html', 'notification.html'];

        for (const template of templates) {
            const templatePath = path.join(templatesDir, template);

            try {
                console.log(`\nChecking template: ${template}`);
                const content = await readFile(templatePath, 'utf8');

                // Check if the template has the expected structure
                if (content.includes('<!DOCTYPE html>') &&
                    content.includes('<html>') &&
                    content.includes('</html>')) {
                    console.log(`✅ Template ${template} is valid HTML`);
                } else {
                    console.log(`❌ Template ${template} does not have valid HTML structure`);
                }

                // Check for placeholders
                const placeholders = content.match(/{{([^}]+)}}/g);
                if (placeholders && placeholders.length > 0) {
                    console.log(`✅ Template ${template} contains ${placeholders.length} placeholders:`);
                    placeholders.forEach(p => console.log(`   - ${p}`));
                } else {
                    console.log(`❌ Template ${template} does not contain any placeholders`);
                }

            } catch (error) {
                console.error(`❌ Error reading template ${template}:`, error.message);
            }
        }

        console.log('\nTemplate test completed!');
    } catch (error) {
        console.error('Error testing templates:', error);
    }
}

// Run the test
testTemplates(); 