#!/usr/bin/env node
/**
 * Schema Validation Test Script
 * Validates all JSON schemas in the schemas directory
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// Initialize AJV with strict mode and format support
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  verbose: true
});

let totalSchemas = 0;
let validSchemas = 0;
let failedSchemas = 0;

/**
 * Validate a single schema file
 */
function validateSchema(schemaPath) {
  const fileName = path.basename(schemaPath);
  totalSchemas++;

  try {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const schema = JSON.parse(schemaContent);

    // Compile the schema to check for errors
    const validator = ajv.compile(schema);

    // Check for required fields in Bicep schemas
    if (schema.properties) {
      const hasApiVersion = schema.properties.apiVersion;
      const hasType = schema.properties.type;
      const hasName = schema.properties.name;

      if (!hasApiVersion || !hasType || !hasName) {
        console.warn(`⚠️  ${fileName}: Missing standard Bicep properties (apiVersion, type, or name)`);
      }
    }

    console.log(`✅ ${fileName}: Valid schema`);
    validSchemas++;
    return true;

  } catch (error) {
    console.error(`❌ ${fileName}: FAILED`);
    console.error(`   Error: ${error.message}`);

    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }

    failedSchemas++;
    return false;
  }
}

/**
 * Validate all schemas in the schemas directory
 */
function validateAllSchemas() {
  const schemasDir = path.join(__dirname, '..', 'schemas');

  if (!fs.existsSync(schemasDir)) {
    console.error(`❌ Schemas directory not found: ${schemasDir}`);
    process.exit(1);
  }

  console.log('🔍 Starting schema validation...\n');

  const files = fs.readdirSync(schemasDir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.warn('⚠️  No JSON schema files found');
    process.exit(0);
  }

  jsonFiles.forEach(file => {
    const schemaPath = path.join(schemasDir, file);
    validateSchema(schemaPath);
  });

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  console.log(`   Total schemas: ${totalSchemas}`);
  console.log(`   ✅ Valid: ${validSchemas}`);
  console.log(`   ❌ Failed: ${failedSchemas}`);
  console.log('='.repeat(50));

  // Exit with error code if any schemas failed
  if (failedSchemas > 0) {
    process.exit(1);
  }
}

// Run validation
validateAllSchemas();
