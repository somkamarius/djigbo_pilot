require('dotenv').config();
const { generateConversationSummaryV2, generateSimpleSummary } = require('./database');

async function testSummaryV2() {
    console.log('Testing V2 Conversation Summary Generation...\n');

    // Sample conversation
    const messages = [
        { role: 'user', content: 'Can you help me understand machine learning?' },
        { role: 'assistant', content: 'Of course! Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.' },
        { role: 'user', content: 'What are the main types of machine learning?' },
        { role: 'assistant', content: 'There are three main types: supervised learning (learning from labeled data), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through trial and error with rewards).' },
        { role: 'user', content: 'Can you give me an example of supervised learning?' },
        { role: 'assistant', content: 'Sure! A classic example is email spam detection. The algorithm is trained on emails that are labeled as "spam" or "not spam", and then it learns to classify new emails based on patterns it observed in the training data.' }
    ];

    const assistantResponse = 'That\'s a great example! The key is that supervised learning requires labeled training data to learn the mapping between inputs and outputs.';

    console.log('Sample Conversation:');
    console.log('==================');
    messages.forEach(msg => {
        console.log(`${msg.role}: ${msg.content}`);
    });
    console.log(`assistant: ${assistantResponse}\n`);

    try {
        // Test 1: Simple summary (fallback)
        console.log('1. Testing Simple Summary (Fallback):');
        console.log('=====================================');
        const simpleSummary = generateSimpleSummary(messages, assistantResponse);
        console.log(`Summary: ${simpleSummary}\n`);

        // Test 2: Bedrock summary (if configured)
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.BEDROCK_MODEL_ID) {
            console.log('2. Testing Bedrock Summary:');
            console.log('===========================');
            try {
                const bedrockSummary = await generateConversationSummaryV2(messages, assistantResponse, 'bedrock');
                console.log(`Summary: ${bedrockSummary}\n`);
            } catch (error) {
                console.log(`❌ Bedrock summary failed: ${error.message}\n`);
            }
        } else {
            console.log('2. Skipping Bedrock Summary (AWS credentials not configured)\n');
        }

        // Test 3: Ollama summary (if available)
        console.log('3. Testing Ollama Summary:');
        console.log('==========================');
        try {
            const ollamaSummary = await generateConversationSummaryV2(messages, assistantResponse, 'ollama');
            console.log(`Summary: ${ollamaSummary}\n`);
        } catch (error) {
            console.log(`❌ Ollama summary failed: ${error.message}\n`);
        }

        // Test 4: Test with different conversation types
        console.log('4. Testing Different Conversation Types:');
        console.log('========================================');

        const shortConversation = [
            { role: 'user', content: 'Hello!' },
            { role: 'assistant', content: 'Hi there! How can I help you today?' }
        ];

        const shortSummary = await generateConversationSummaryV2(shortConversation, 'Hi there! How can I help you today?', 'simple');
        console.log(`Short conversation summary: ${shortSummary}`);

        const longConversation = [
            { role: 'user', content: 'I need help with a complex programming problem involving data structures and algorithms.' },
            { role: 'assistant', content: 'I\'d be happy to help! Could you provide more details about the specific problem you\'re working on?' },
            { role: 'user', content: 'I\'m trying to implement a binary search tree with insertion, deletion, and traversal operations.' },
            { role: 'assistant', content: 'Great! Binary search trees are fundamental data structures. Let\'s break this down step by step.' },
            { role: 'user', content: 'I\'m having trouble with the deletion operation, especially when the node has two children.' },
            { role: 'assistant', content: 'Ah, that\'s a common challenge! When deleting a node with two children, you need to find the inorder successor or predecessor.' }
        ];

        const longSummary = await generateConversationSummaryV2(longConversation, 'The key is to maintain the BST property while handling the replacement node correctly.', 'simple');
        console.log(`Long conversation summary: ${longSummary}\n`);

        console.log('🎉 V2 Summary testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testSummaryV2(); 