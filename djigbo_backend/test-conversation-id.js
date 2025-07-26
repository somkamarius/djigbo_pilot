const fetch = require('node-fetch');

// Test conversation ID logic
async function testConversationIdLogic() {
    console.log('Testing Conversation ID Logic...\n');

    const baseUrl = 'http://localhost:8000';
    const testToken = 'test-token'; // In real scenario, this would be a valid JWT token

    try {
        // Test 1: First message - should create new conversation ID
        console.log('1. Testing first message (should create new conversation ID)...');
        const response1 = await fetch(`${baseUrl}/api/ollama-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello, how are you?' }
                ]
            })
        });

        const data1 = await response1.json();
        console.log(`✅ First message - Conversation ID: ${data1.conversation_id}`);
        const firstConversationId = data1.conversation_id;

        // Test 2: Follow-up message - should retain same conversation ID
        console.log('\n2. Testing follow-up message (should retain same conversation ID)...');
        const response2 = await fetch(`${baseUrl}/api/ollama-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Hello, how are you?' },
                    { role: 'assistant', content: data1.content },
                    { role: 'user', content: 'That sounds good, tell me more about yourself.' }
                ],
                conversation_id: firstConversationId
            })
        });

        const data2 = await response2.json();
        console.log(`✅ Follow-up message - Conversation ID: ${data2.conversation_id}`);
        console.log(`   Same ID retained: ${data2.conversation_id === firstConversationId ? '✅ YES' : '❌ NO'}`);

        // Test 3: New conversation topic - should create new conversation ID
        console.log('\n3. Testing new conversation topic (should create new conversation ID)...');
        const response3 = await fetch(`${baseUrl}/api/ollama-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'What is the weather like today?' }
                ]
            })
        });

        const data3 = await response3.json();
        console.log(`✅ New topic - Conversation ID: ${data3.conversation_id}`);
        console.log(`   Different ID created: ${data3.conversation_id !== firstConversationId ? '✅ YES' : '❌ NO'}`);

        // Test 4: Explicit conversation ID - should use provided ID
        console.log('\n4. Testing explicit conversation ID (should use provided ID)...');
        const customConversationId = 'custom_conv_12345';
        const response4 = await fetch(`${baseUrl}/api/ollama-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${testToken}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'This is a test with custom ID.' }
                ],
                conversation_id: customConversationId
            })
        });

        const data4 = await response4.json();
        console.log(`✅ Custom ID - Conversation ID: ${data4.conversation_id}`);
        console.log(`   Custom ID used: ${data4.conversation_id === customConversationId ? '✅ YES' : '❌ NO'}`);

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testConversationIdLogic(); 