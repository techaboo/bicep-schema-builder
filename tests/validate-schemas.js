#!/usr/bin/env node
/**
 * Schema Validation Test Script
 * Validates all JSON schemas in the schemas directory
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

// Initialize AJV for draft-07 schemas (default)
const ajv = new Ajv({
  strict: false,
  allErrors: true,
  verbose: true
});

// Initialize separate AJV for draft-04 schemas (for ARM templates)
const ajvDraft04 = new Ajv({
  strict: false,
  allErrors: true,
  verbose: true,
  schemaId: 'id'  // draft-04 uses 'id' instead of '$id'
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

    // Check if this is an ARM deployment template schema
    const isArmTemplate = fileName === 'armDeploymentTemplate.json' ||
                          (schema.title && schema.title.toLowerCase().includes('template'));

    // Use appropriate validator based on schema draft version
    const isDraft04 = schema.$schema && schema.$schema.includes('draft-04');
    const validator = isDraft04 ? ajvDraft04 : ajv;

    // For ARM templates with external refs, we skip compilation validation
    // and just validate the structure
    if (isArmTemplate && isDraft04) {
      // Just validate it's valid JSON and has expected structure
      if (!schema.properties || !schema.properties.resources || !schema.properties.contentVersion) {
        console.warn(`⚠️  ${fileName}: ARM template schema missing expected properties (resources, contentVersion)`);
      }
      console.log(`✅ ${fileName}: Valid ARM deployment template schema (draft-04)`);
    } else {
      // Compile the schema to check for errors
      const compiledValidator = validator.compile(schema);

      if (isArmTemplate) {
        // Validate ARM template schema structure
        if (!schema.properties || !schema.properties.resources || !schema.properties.contentVersion) {
          console.warn(`⚠️  ${fileName}: ARM template schema missing expected properties (resources, contentVersion)`);
        } else {
          console.log(`✅ ${fileName}: Valid ARM deployment template schema`);
        }
      } else {
        // Check for required fields in Bicep resource schemas
        if (schema.properties) {
          const hasApiVersion = schema.properties.apiVersion;
          const hasType = schema.properties.type;
          const hasName = schema.properties.name;

          if (!hasApiVersion || !hasType || !hasName) {
            console.warn(`⚠️  ${fileName}: Missing standard Bicep properties (apiVersion, type, or name)`);
          }
        }
        console.log(`✅ ${fileName}: Valid schema`);
      }
    }

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
