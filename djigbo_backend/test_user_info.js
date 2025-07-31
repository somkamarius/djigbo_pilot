const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000';

// Mock Auth0 token for testing (you'll need to replace this with a real token)
const MOCK_TOKEN = 'your-auth0-token-here';

async function testUserEndpoints() {
    console.log('🔍 Testing User Information Endpoints...\n');
    console.log('='.repeat(60));

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCK_TOKEN}`
    };

    try {
        // Test 1: Check if user exists
        console.log('\n1️⃣ Testing GET /api/user/check');
        console.log('-'.repeat(40));
        const checkResponse = await fetch(`${BASE_URL}/api/user/check`, {
            method: 'GET',
            headers
        });

        if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            console.log('✅ User check successful:');
            console.log('   - User exists:', checkData.exists);
            if (checkData.user) {
                console.log('   - User ID:', checkData.user.id);
                console.log('   - Auth0 ID:', checkData.user.auth0_user_id);
                console.log('   - Nickname:', checkData.user.nickname);
                console.log('   - Has Avatar:', !!checkData.user.avatar);
                console.log('   - Created:', checkData.user.created_at);
                console.log('   - Updated:', checkData.user.updated_at);
            }
        } else {
            console.log('❌ User check failed:', checkResponse.status, checkResponse.statusText);
        }

        // Test 2: Get user profile
        console.log('\n2️⃣ Testing GET /api/profile');
        console.log('-'.repeat(40));
        const profileResponse = await fetch(`${BASE_URL}/api/profile`, {
            method: 'GET',
            headers
        });

        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile retrieval successful:');
            console.log('   - User data:', JSON.stringify(profileData.user, null, 2));
        } else {
            console.log('❌ Profile retrieval failed:', profileResponse.status, profileResponse.statusText);
        }

        // Test 3: Get user conversations (activity)
        console.log('\n3️⃣ Testing GET /api/conversations');
        console.log('-'.repeat(40));
        const conversationsResponse = await fetch(`${BASE_URL}/api/conversations`, {
            method: 'GET',
            headers
        });

        if (conversationsResponse.ok) {
            const conversationsData = await conversationsResponse.json();
            console.log('✅ Conversations retrieval successful:');
            console.log('   - Total conversations:', conversationsData.count);
            if (conversationsData.conversations && conversationsData.conversations.length > 0) {
                console.log('   - Recent conversations:');
                conversationsData.conversations.slice(0, 3).forEach((conv, index) => {
                    console.log(`     ${index + 1}. ID: ${conv.conversation_id}`);
                    console.log(`        Summary: ${conv.summary.substring(0, 100)}...`);
                    console.log(`        Messages: ${conv.message_count}`);
                    console.log(`        Updated: ${conv.updated_at}`);
                });
            }
        } else {
            console.log('❌ Conversations retrieval failed:', conversationsResponse.status, conversationsResponse.statusText);
        }

        // Test 4: Get conversation count
        console.log('\n4️⃣ Testing GET /api/conversations/count');
        console.log('-'.repeat(40));
        const countResponse = await fetch(`${BASE_URL}/api/conversations/count`, {
            method: 'GET',
            headers
        });

        if (countResponse.ok) {
            const countData = await countResponse.json();
            console.log('✅ Conversation count successful:');
            console.log('   - Total conversations:', countData.count);
        } else {
            console.log('❌ Conversation count failed:', countResponse.status, countResponse.statusText);
        }

        // Test 5: Get conversation stats
        console.log('\n5️⃣ Testing GET /api/conversations/stats');
        console.log('-'.repeat(40));
        const statsResponse = await fetch(`${BASE_URL}/api/conversations/stats`, {
            method: 'GET',
            headers
        });

        if (statsResponse.ok) {
            const statsData = await statsResponse.json();
            console.log('✅ Conversation stats successful:');
            console.log('   - Stats:', JSON.stringify(statsData, null, 2));
        } else {
            console.log('❌ Conversation stats failed:', statsResponse.status, statsResponse.statusText);
        }

        // Test 6: Get user mood entries (activity)
        console.log('\n6️⃣ Testing GET /api/mood/personal');
        console.log('-'.repeat(40));
        const moodResponse = await fetch(`${BASE_URL}/api/mood/personal`, {
            method: 'GET',
            headers
        });

        if (moodResponse.ok) {
            const moodData = await moodResponse.json();
            console.log('✅ Mood entries retrieval successful:');
            console.log('   - Total entries:', moodData.entries.length);
            if (moodData.stats) {
                console.log('   - Mood statistics:');
                console.log(`     - Average mood: ${moodData.stats.avg_mood}`);
                console.log(`     - Min mood: ${moodData.stats.min_mood}`);
                console.log(`     - Max mood: ${moodData.stats.max_mood}`);
                console.log(`     - Days with entries: ${moodData.stats.days_with_entries}`);
            }
            if (moodData.entries && moodData.entries.length > 0) {
                console.log('   - Recent mood entries:');
                moodData.entries.slice(0, 3).forEach((entry, index) => {
                    console.log(`     ${index + 1}. Score: ${entry.mood_score}/5`);
                    console.log(`        Thoughts: ${entry.thoughts || 'None'}`);
                    console.log(`        Date: ${entry.created_at}`);
                });
            }
        } else {
            console.log('❌ Mood entries retrieval failed:', moodResponse.status, moodResponse.statusText);
        }

        // Test 7: Get user feedback (activity)
        console.log('\n7️⃣ Testing GET /api/feedback');
        console.log('-'.repeat(40));
        const feedbackResponse = await fetch(`${BASE_URL}/api/feedback`, {
            method: 'GET',
            headers
        });

        if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            console.log('✅ Feedback retrieval successful:');
            console.log('   - Total feedback entries:', feedbackData.feedback.length);
            if (feedbackData.feedback && feedbackData.feedback.length > 0) {
                console.log('   - Recent feedback:');
                feedbackData.feedback.slice(0, 3).forEach((fb, index) => {
                    console.log(`     ${index + 1}. Text: ${fb.feedback_text.substring(0, 100)}...`);
                    console.log(`        Date: ${fb.created_at}`);
                });
            }
        } else {
            console.log('❌ Feedback retrieval failed:', feedbackResponse.status, feedbackResponse.statusText);
        }

        // Test 8: Get camp mood data (community activity)
        console.log('\n8️⃣ Testing GET /api/mood/camp');
        console.log('-'.repeat(40));
        const campMoodResponse = await fetch(`${BASE_URL}/api/mood/camp`, {
            method: 'GET',
            headers
        });

        if (campMoodResponse.ok) {
            const campMoodData = await campMoodResponse.json();
            console.log('✅ Camp mood data successful:');
            console.log('   - Camp mood data:', JSON.stringify(campMoodData, null, 2));
        } else {
            console.log('❌ Camp mood data failed:', campMoodResponse.status, campMoodResponse.statusText);
        }

        // Test 9: Get participants mood (community activity)
        console.log('\n9️⃣ Testing GET /api/mood/participants');
        console.log('-'.repeat(40));
        const participantsResponse = await fetch(`${BASE_URL}/api/mood/participants`, {
            method: 'GET',
            headers
        });

        if (participantsResponse.ok) {
            const participantsData = await participantsResponse.json();
            console.log('✅ Participants mood data successful:');
            console.log('   - Participants data:', JSON.stringify(participantsData, null, 2));
        } else {
            console.log('❌ Participants mood data failed:', participantsResponse.status, participantsResponse.statusText);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 All endpoint tests completed!');
        console.log('\n📊 Summary of Available User Information:');
        console.log('   • Basic Profile: Name (nickname), Avatar, Creation/Update dates');
        console.log('   • Activity: Conversation count, Recent conversations, Message counts');
        console.log('   • Mood Tracking: Personal mood entries, Mood statistics, Thoughts');
        console.log('   • Feedback: User feedback entries and timestamps');
        console.log('   • Community: Camp mood data, Participant activity');
        console.log('   • Auth0 Integration: User authentication and profile data');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
    }
}

// Run the tests
testUserEndpoints(); 