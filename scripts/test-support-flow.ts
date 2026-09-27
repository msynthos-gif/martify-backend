async function testSupportFlow() {
  const baseURL = 'http://localhost:5000/api';

  console.log('--- 1. Login as Support ---');
  const supportLogin = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'support1@nayyar.com',
      password: 'nayyar123@#$',
    }),
  }).then(r => r.json());

  const supportToken = supportLogin.data?.token;
  console.log('Support login status:', supportLogin.success, supportLogin.message || '');

  console.log('--- 2. Register fresh test seller ---');
  const regRes = await fetch(`${baseURL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Chat Test Seller',
      email: `chat.seller.${Date.now()}@test.com`,
      password: 'SellerPass123!',
      phone: '+923001234567',
    }),
  }).then(r => r.json());

  const sellerToken = regRes.data?.token;
  const sellerUser = regRes.data?.user;
  console.log('Registered test seller:', sellerUser?.email, 'sellerStatus:', sellerUser?.sellerStatus);

  console.log('--- 3. Seller: GET /support/conversation ---');
  const convRes = await fetch(`${baseURL}/support/conversation`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  }).then(r => r.json());
  console.log('Seller Conversation status:', convRes.success);
  console.log('Seller Conversation ID:', convRes.data?.id);
  console.log('Initial Messages Count:', convRes.data?.messages?.length);

  console.log('--- 4. Seller: Send message 1 ---');
  const send1 = await fetch(`${baseURL}/support/conversation/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ message: 'Hello Support, I have a question about my account.' }),
  }).then(r => r.json());
  console.log('Send 1 status:', send1.success);
  console.log('Messages count returned after send 1:', send1.data?.messages?.length);

  console.log('--- 5. Seller: Send message 2 ---');
  const send2 = await fetch(`${baseURL}/support/conversation/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sellerToken}`,
    },
    body: JSON.stringify({ message: 'Can you please check my verification?' }),
  }).then(r => r.json());
  console.log('Send 2 status:', send2.success);
  console.log('Messages count returned after send 2:', send2.data?.messages?.length);

  console.log('--- 6. Seller: Re-fetch conversation to test persistence ---');
  const refetch = await fetch(`${baseURL}/support/conversation`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  }).then(r => r.json());
  console.log('Refetch messages count in DB:', refetch.data?.messages?.length);
  console.log('Messages content:', refetch.data?.messages?.map((m: any) => `[${m.senderRole}] ${m.message}`));

  console.log('--- 7. Support: List tickets ---');
  const listRes = await fetch(`${baseURL}/support/tickets`, {
    headers: { Authorization: `Bearer ${supportToken}` },
  }).then(r => r.json());
  console.log('Support tickets total count:', listRes.data?.length);
  const myTicketInList = listRes.data?.find((t: any) => t.id === convRes.data?.id);
  console.log('Found ticket in list:', !!myTicketInList, 'latest msg preview:', myTicketInList?.messages?.[0]?.message);

  console.log('--- 8. Support: View conversation detail ---');
  const detailRes = await fetch(`${baseURL}/support/tickets/${convRes.data?.id}`, {
    headers: { Authorization: `Bearer ${supportToken}` },
  }).then(r => r.json());
  console.log('Detail messages count for support:', detailRes.data?.messages?.length);

  console.log('--- 9. Support: Send reply to seller ---');
  const replyRes = await fetch(`${baseURL}/support/tickets/${convRes.data?.id}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supportToken}`,
    },
    body: JSON.stringify({ message: 'Hello! Sure, we are reviewing your documents now.' }),
  }).then(r => r.json());
  console.log('Support reply status:', replyRes.success);
  console.log('Support reply data:', replyRes.data);

  console.log('--- 10. Seller: Check final conversation ---');
  const finalRes = await fetch(`${baseURL}/support/conversation`, {
    headers: { Authorization: `Bearer ${sellerToken}` },
  }).then(r => r.json());
  console.log('Final seller conversation messages count:', finalRes.data?.messages?.length);
  console.log('Final messages:');
  finalRes.data?.messages?.forEach((m: any) => {
    console.log(` - [${m.senderRole} at ${m.createdAt}]: ${m.message}`);
  });
}

testSupportFlow().catch(console.error);
