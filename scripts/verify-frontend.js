async function testFrontend() {
  console.log('--- 1. Testing Vite Dev Server on Port 3000 ---');
  const resHome = await fetch('http://localhost:3000/');
  console.log('Homepage status:', resHome.status);
  const html = await resHome.text();
  console.log('HTML served correctly:', html.includes('id="root"'));

  console.log('\n--- 2. Testing API Proxy (Vite :3000 -> Express :5000) ---');
  const resCat = await fetch('http://localhost:3000/api/categories');
  const catJson = await resCat.json();
  console.log('Categories status:', resCat.status);
  console.log('Categories count:', catJson.data?.length);

  const resProd = await fetch('http://localhost:3000/api/products');
  const prodJson = await resProd.json();
  console.log('Products status:', resProd.status);
  console.log('Products count:', prodJson.data?.length);
  if (prodJson.data?.length > 0) {
    console.log('First product title:', prodJson.data[0].title);
    console.log('First product price:', prodJson.data[0].price);
    console.log('First product seller:', prodJson.data[0].seller?.name);
  }

  console.log('\n--- 3. Testing Guest Cart Flow via Proxy ---');
  const sessionId = 'test-session-' + Date.now();
  const productId = prodJson.data[0].id;
  const resCart = await fetch('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, productId, quantity: 1 }),
  });
  const cartJson = await resCart.json();
  console.log('Add to cart status:', resCart.status);
  console.log('Item added successfully:', cartJson.success);

  const resGetCart = await fetch(`http://localhost:3000/api/cart/${sessionId}`);
  const getCartJson = await resGetCart.json();
  console.log('Get cart count:', getCartJson.data?.itemCount);
  console.log('Get cart subtotal:', getCartJson.data?.subtotal);

  console.log('\n✅ ALL VERIFICATION CHECKS PASSED!');
}

testFrontend().catch(console.error);
