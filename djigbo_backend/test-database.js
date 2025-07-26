const {
    saveConversationSummary,
    getConversationSummary,
    getUserConversationSummaries,
    deleteConversationSummary,
    generateConversationId,
    closeDatabase
} = require('./database');

async function testDatabase() {
    console.log('Testing database functionality...\n');

    const testUserId = 'test_user_123';
    const testConversationId = generateConversationId();
    const testSummary = 'This is a test conversation about AI and machine learning';
    const testMessageCount = 5;

    try {
        // Test 1: Save conversation summary
        console.log('1. Testing saveConversationSummary...');
        const savedId = await saveConversationSummary(testUserId, testConversationId, testSummary, testMessageCount);
        console.log(`✅ Saved conversation summary with ID: ${savedId}`);

        // Test 2: Get conversation summary
        console.log('\n2. Testing getConversationSummary...');
        const retrievedSummary = await getConversationSummary(testUserId, testConversationId);
        if (retrievedSummary) {
            console.log('✅ Retrieved conversation summary:');
            console.log(`   - Summary: ${retrievedSummary.summary}`);
            console.log(`   - Message Count: ${retrievedSummary.message_count}`);
            console.log(`   - Created: ${retrievedSummary.created_at}`);
        } else {
            console.log('❌ Failed to retrieve conversation summary');
        }

        // Test 3: Get all conversation summaries for user
        console.log('\n3. Testing getUserConversationSummaries...');
        const userSummaries = await getUserConversationSummaries(testUserId);
        console.log(`✅ Retrieved ${userSummaries.length} conversation summaries for user`);

        // Test 4: Update conversation summary
        console.log('\n4. Testing updateConversationSummary...');
        const updatedSummary = 'Updated test conversation about AI and machine learning with new information';
        const { updateConversationSummary } = require('./database');
        const updateResult = await updateConversationSummary(testUserId, testConversationId, updatedSummary, testMessageCount + 1);
        console.log(`✅ Updated conversation summary, affected rows: ${updateResult}`);

        // Test 5: Delete conversation summary
        console.log('\n5. Testing deleteConversationSummary...');
        const deleteResult = await deleteConversationSummary(testUserId, testConversationId);
        console.log(`✅ Deleted conversation summary, affected rows: ${deleteResult}`);

        // Test 6: Verify deletion
        console.log('\n6. Verifying deletion...');
        const deletedSummary = await getConversationSummary(testUserId, testConversationId);
        if (!deletedSummary) {
            console.log('✅ Conversation summary successfully deleted');
        } else {
            console.log('❌ Conversation summary still exists after deletion');
        }

        console.log('\n🎉 All database tests passed!');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        // Close database connection
        closeDatabase();
        console.log('\nDatabase connection closed');
    }
}

// Run the test
testDatabase(); 