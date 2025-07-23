#!/usr/bin/env node

/**
 * Test script for IM Migration Validator
 * Run this to check which components need to migrate to dependency injection
 */

import { imMigrationValidator } from './modules/core/imMigrationValidator.mjs';
import { startDependencyEnforcement } from './modules/core/dependencyEnforcement.mjs';

async function runIMValidationTest() {
    console.log('🔄 Testing IM Migration Validator...\n');
    
    try {
        // Test 1: Basic migration validation
        console.log('📊 Running IM migration analysis...');
        const results = await imMigrationValidator.validateIMMigration('.');
        
        console.log('\n📈 Migration Analysis Results:');
        console.log(`  Total Components: ${results.complianceStats.total}`);
        console.log(`  Fully Migrated: ${results.complianceStats.fullyMigrated}`);
        console.log(`  Partially Migrated: ${results.complianceStats.partiallyMigrated}`);
        console.log(`  Not Migrated: ${results.complianceStats.notMigrated}`);
        
        const migrationRate = results.complianceStats.total > 0 ? 
            (results.complianceStats.fullyMigrated / results.complianceStats.total * 100).toFixed(1) : 100;
        console.log(`  Migration Rate: ${migrationRate}%\n`);
        
        // Test 2: Show specific issues
        console.log('🔍 Migration Issues Found:');
        const { migrationIssues } = results;
        
        if (migrationIssues.usingServiceLocator.length > 0) {
            console.log(`  ❌ Using Service Locator: ${migrationIssues.usingServiceLocator.length} components`);
            migrationIssues.usingServiceLocator.forEach(comp => {
                console.log(`    - ${comp.name} (${comp.file})`);
            });
        }
        
        if (migrationIssues.notExtendingBaseComponent.length > 0) {
            console.log(`  ❌ Not Extending BaseComponent: ${migrationIssues.notExtendingBaseComponent.length} components`);
            migrationIssues.notExtendingBaseComponent.forEach(comp => {
                console.log(`    - ${comp.name} (${comp.file})`);
            });
        }
        
        if (migrationIssues.notUsingDependencyInjection.length > 0) {
            console.log(`  ⚠️  Not Using Dependency Injection: ${migrationIssues.notUsingDependencyInjection.length} components`);
            migrationIssues.notUsingDependencyInjection.forEach(comp => {
                console.log(`    - ${comp.name} (${comp.file})`);
            });
        }
        
        if (migrationIssues.missingInitializeSignature.length > 0) {
            console.log(`  ⚠️  Missing Initialize Signature: ${migrationIssues.missingInitializeSignature.length} components`);
            migrationIssues.missingInitializeSignature.forEach(comp => {
                console.log(`    - ${comp.name} (${comp.file})`);
            });
        }
        
        // Test 3: Generate detailed report
        console.log('\n📋 Generating detailed migration report...');
        const report = imMigrationValidator.generateMigrationReport();
        
        // Save report to file
        const fs = await import('fs/promises');
        await fs.writeFile('./im-migration-test-report.md', report);
        console.log('✅ Migration report saved to: im-migration-test-report.md\n');
        
        // Test 4: Show recommendations
        console.log('💡 Priority Recommendations:');
        results.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
            console.log(`     Components: ${rec.components.slice(0, 3).join(', ')}${rec.components.length > 3 ? '...' : ''}`);
            console.log(`     Action: ${rec.action}\n`);
        });
        
        // Test 5: Test enforcement (in warn mode)
        console.log('🚨 Testing enforcement in WARN mode...');
        try {
            imMigrationValidator.enforceIMCompliance();
            console.log('✅ All components are fully migrated!');
        } catch (error) {
            console.log('⚠️  Found components that need migration:');
            console.log(error.message);
        }
        
        console.log('\n🎯 Migration Test Complete!');
        console.log('Next steps:');
        console.log('1. Review the detailed report: im-migration-test-report.md');
        console.log('2. Fix HIGH priority issues first (service locator usage)');
        console.log('3. Update components to extend BaseComponent');
        console.log('4. Change initialize() to initialize(dependencies)');
        console.log('5. Run with STRICT enforcement when ready');
        
    } catch (error) {
        console.error('❌ IM Migration validation failed:', error);
        process.exit(1);
    }
}

async function testFullEnforcement() {
    console.log('\n\n🔒 Testing Full Dependency Enforcement with IM Migration...\n');
    
    try {
        // Test integrated enforcement in WARN mode
        const result = await startDependencyEnforcement({
            enforcementLevel: 'WARN',
            generateReport: true,
            failOnViolations: false
        });
        
        console.log('✅ Full enforcement test completed');
        console.log('Reports generated:');
        console.log('  - compliance-report.md (general compliance)');
        console.log('  - im-migration-report.md (migration status)');
        
    } catch (error) {
        console.log('⚠️  Enforcement test found issues (expected in WARN mode)');
        console.log('Check the generated reports for details');
    }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
    await runIMValidationTest();
    await testFullEnforcement();
}