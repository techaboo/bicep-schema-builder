# 🔧 Bicep Schema Builder

An interactive web tool for building, validating, and managing Azure Bicep JSON schemas. Perfect for developers working with Infrastructure as Code (IaC) and Azure Resource Manager templates.

![Bicep Schema Builder](https://img.shields.io/badge/Azure-Bicep-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)
![Schema](https://img.shields.io/badge/JSON-Schema-green)

## ✨ Features

- **📁 Schema Upload**: Upload and validate existing JSON schema files
- **✏️ Interactive Editor**: Built-in schema editor with syntax highlighting
- **✅ Real-time Validation**: Instant feedback on schema structure and Bicep compliance
- **📋 Template Library**: Pre-built templates for common Azure resources
- **🎨 Format & Download**: Format JSON and download validated schemas
- **🔍 Bicep-Specific Validation**: Specialized checks for Azure Bicep patterns

## 🚀 Supported Azure Resources

- **Storage Accounts** (`Microsoft.Storage/storageAccounts`)
- **Virtual Machines** (`Microsoft.Compute/virtualMachines`)
- **Web Apps** (`Microsoft.Web/sites`)
- **Key Vaults** (`Microsoft.KeyVault/vaults`)

## 🏗️ Project Structure

```
bicep-schema-builder/
├── index.html              # Main application interface
├── style.css               # Application styling
├── script.js               # Main application logic
├── utils/
│   └── schemaParser.js     # Schema parsing and validation utilities
└── schemas/
    ├── storageAccount.json # Storage Account schema template
    ├── webApp.json         # Web App schema template
    ├── virtualMachine.json # Virtual Machine schema template
    └── keyVault.json       # Key Vault schema template
```

## 🎯 Getting Started

### Option 1: Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/bicep-schema-builder.git
   cd bicep-schema-builder
   ```

2. **Open in your browser**:
   - Simply open `index.html` in your web browser
   - Or use a local server like Live Server in VS Code

### Option 2: GitHub Pages (Live Demo)

Visit the live demo at: `https://yourusername.github.io/bicep-schema-builder`

## 🎨 Usage

1. **Upload a Schema**: Click "Choose JSON Schema File" to upload existing schemas
2. **Use Templates**: Click any template button to load pre-built Azure resource schemas
3. **Edit & Validate**: Use the editor to modify schemas and see real-time validation
4. **Format**: Click "Format JSON" to beautify your schema
5. **Download**: Click "Download Schema" to save your validated schema

## 🔧 Features in Detail

### Schema Validation
- **JSON Syntax Checking**: Ensures valid JSON structure
- **Schema Structure Validation**: Validates JSON Schema compliance
- **Bicep Pattern Recognition**: Identifies and validates Bicep-specific patterns
- **Resource Type Validation**: Checks against known Azure resource types
- **API Version Validation**: Ensures proper API version format

### Template System
Each template includes:
- Complete resource schema structure
- Required and optional properties
- Validation patterns for resource names
- Enum values for allowed options
- Comprehensive documentation

### Real-time Features
- **Live JSON Validation**: Editor border changes color based on JSON validity
- **Instant Feedback**: Validation results appear immediately
- **Progressive Enhancement**: Works without JavaScript for basic functionality

## 🛠️ Technical Details

### Built With
- **HTML5**: Semantic markup and modern web standards
- **CSS3**: Flexbox/Grid layouts, animations, responsive design
- **Vanilla JavaScript**: No external dependencies
- **JSON Schema Draft-07**: Industry-standard schema validation

### Browser Compatibility
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

## 📊 Schema Examples

### Storage Account
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "apiVersion": {
      "enum": ["2022-05-01"]
    },
    "type": {
      "const": "Microsoft.Storage/storageAccounts"
    },
    "name": {
      "pattern": "^[a-z0-9]{3,24}$"
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup
```bash
# Clone your fork
git clone https://github.com/yourusername/bicep-schema-builder.git

# Create a new branch
git checkout -b feature/new-feature

# Make your changes and test locally
# Open index.html in your browser

# Commit and push
git add .
git commit -m "Your feature description"
git push origin feature/new-feature
```

## 📝 Future Enhancements

- [ ] TypeScript interface generation from schemas
- [ ] Bicep template generation from schemas
- [ ] Schema comparison and diffing
- [ ] Export to various formats (YAML, etc.)
- [ ] Integration with Azure Resource Graph
- [ ] Custom validation rule builder
- [ ] Schema versioning and history
- [ ] Multi-schema validation
- [ ] Dark mode support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Azure Bicep team for the amazing IaC language
- JSON Schema community for the validation standards
- Microsoft Azure documentation team

## 🔗 Useful Links

- [Azure Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)
- [JSON Schema Specification](https://json-schema.org/)
- [Azure Resource Manager Templates](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/)

---

**Made with ❤️ for the Azure Bicep community**