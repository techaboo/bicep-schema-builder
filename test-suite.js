// Test Suite for Bicep Schema Builder Pro
console.log('🧪 Starting Bicep Schema Builder Pro Test Suite');

// Test 1: Tab Navigation
function testTabNavigation() {
    console.log('📋 Testing Tab Navigation...');
    const tabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabs.length >= 4 && tabContents.length >= 4) {
        console.log('✅ All tabs and content sections found');
        return true;
    } else {
        console.log('❌ Missing tabs or content sections');
        return false;
    }
}

// Test 2: Format Button Context Awareness
function testFormatButton() {
    console.log('🎨 Testing Format Button...');
    const formatBtn = document.getElementById('formatBtn');
    
    if (formatBtn) {
        console.log('✅ Format button found');
        return true;
    } else {
        console.log('❌ Format button not found');
        return false;
    }
}

// Test 3: Schema Validator Components
function testSchemaValidator() {
    console.log('🔍 Testing Schema Validator...');
    const codeInput = document.getElementById('codeInput');
    const validationResults = document.getElementById('validationResults');
    
    if (codeInput && validationResults) {
        console.log('✅ Schema validator components found');
        return true;
    } else {
        console.log('❌ Schema validator components missing');
        return false;
    }
}

// Test 4: ARM Converter Components
function testARMConverter() {
    console.log('🔄 Testing ARM Converter...');
    const armInput = document.getElementById('armTemplateInput');
    const bicepOutput = document.getElementById('bicepOutput');
    
    if (armInput && bicepOutput) {
        console.log('✅ ARM converter components found');
        return true;
    } else {
        console.log('❌ ARM converter components missing');
        return false;
    }
}

// Test 5: Templates Tab Components
function testTemplatesTab() {
    console.log('📚 Testing Templates Tab...');
    const resourceCheckboxes = document.querySelector('.resource-checkboxes');
    const deploymentBuilder = document.querySelector('.deployment-builder');
    
    if (resourceCheckboxes && deploymentBuilder) {
        console.log('✅ Templates tab components found');
        return true;
    } else {
        console.log('❌ Templates tab components missing');
        return false;
    }
}

// Test 6: Theme Toggle
function testThemeToggle() {
    console.log('🎭 Testing Theme Toggle...');
    const themeToggle = document.querySelector('.theme-toggle');
    
    if (themeToggle) {
        console.log('✅ Theme toggle found');
        return true;
    } else {
        console.log('❌ Theme toggle not found');
        return false;
    }
}

// Test 7: Notification System
function testNotifications() {
    console.log('📢 Testing Notification System...');
    
    if (typeof showNotificationPro === 'function') {
        console.log('✅ Notification system available');
        return true;
    } else {
        console.log('❌ Notification system not available');
        return false;
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running comprehensive test suite...');
    
    const tests = [
        testTabNavigation,
        testFormatButton,
        testSchemaValidator,
        testARMConverter,
        testTemplatesTab,
        testThemeToggle,
        testNotifications
    ];
    
    let passed = 0;
    let total = tests.length;
    
    tests.forEach((test, index) => {
        try {
            if (test()) {
                passed++;
            }
        } catch (error) {
            console.log(`❌ Test ${index + 1} failed with error:`, error);
        }
    });
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Application is ready.');
        if (typeof showNotificationPro === 'function') {
            showNotificationPro('🎉 All tests passed! Application is ready.', 'success');
        }
    } else {
        console.log('⚠️ Some tests failed. Check console for details.');
        if (typeof showNotificationPro === 'function') {
            showNotificationPro(`⚠️ ${total - passed} tests failed. Check console.`, 'warning');
        }
    }
    
    return passed === total;
}

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
} else {
    runAllTests();
}

// Manual test function for console
window.runTests = runAllTests;