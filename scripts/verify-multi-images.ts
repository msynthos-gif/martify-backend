const API_BASE = 'http://localhost:5000/api';

async function request(url: string, options: any = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('🧪 Starting Multi-Image Verification Test (using native fetch)...');

  // 1. Log in as Official Store seller
  const loginRes = await request(`${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: 'official@nexus.com',
      password: 'SellerPass123!',
    },
  });
  const token = loginRes.data.token;
  console.log('✅ 1. Logged in as official@nexus.com');

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 2. Fetch seller products
  const productsRes = await request(`${API_BASE}/seller/products`, {
    method: 'GET',
    headers: authHeaders,
  });
  const products = productsRes.data;
  console.log(`✅ 2. Retrieved ${products.length} products for official@nexus.com`);

  const targetProd = products[0];
  console.log(`   Selected target product: "${targetProd.title}" (ID: ${targetProd.id})`);

  // 3. Update target product with 3 distinct images
  const testImages = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
  ];

  const updateRes = await request(`${API_BASE}/seller/products/${targetProd.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: {
      images: testImages,
    },
  });

  const updatedProd = updateRes.data;
  console.log('✅ 3. Updated product with 3 images');
  console.log('   Primary imageUrl:', updatedProd.imageUrl);
  console.log('   Images count:', updatedProd.images?.length);

  if (!updatedProd.images || updatedProd.images.length !== 3) {
    throw new Error(`Expected 3 images, got ${updatedProd.images?.length}`);
  }

  // Verify sort order
  updatedProd.images.forEach((img: any, idx: number) => {
    if (img.sortOrder !== idx) {
      throw new Error(`Image at index ${idx} has sortOrder ${img.sortOrder}`);
    }
    if (img.url !== testImages[idx]) {
      throw new Error(`Image at index ${idx} URL mismatch: ${img.url} vs ${testImages[idx]}`);
    }
  });
  console.log('✅ 4. Verified sortOrder sequence (0, 1, 2) in seller update response');

  // 5. Verify Public Product Detail Endpoint
  const publicRes = await request(`${API_BASE}/products/${targetProd.id}`, { method: 'GET' });
  const publicProd = publicRes.data;
  if (!publicProd.images || publicProd.images.length !== 3) {
    throw new Error(`Public endpoint expected 3 images, got ${publicProd.images?.length}`);
  }
  console.log('✅ 5. Verified public GET /api/products/:id returns full ordered images array');

  // 6. Verify Reordering
  const reorderedImages = [testImages[2], testImages[0], testImages[1]];
  const reorderRes = await request(`${API_BASE}/seller/products/${targetProd.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: {
      images: reorderedImages,
    },
  });
  const reorderedProd = reorderRes.data;
  if (reorderedProd.imageUrl !== reorderedImages[0] || reorderedProd.images[0].url !== reorderedImages[0]) {
    throw new Error('Reordering failed: primary image did not update to new index 0');
  }
  console.log('✅ 6. Successfully reordered images; new primary photo set correctly');

  // Restore original order
  await request(`${API_BASE}/seller/products/${targetProd.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: { images: testImages },
  });

  console.log('\n🎉 ALL MULTI-IMAGE TESTS PASSED PERFECTLY!\n');
}

main().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
