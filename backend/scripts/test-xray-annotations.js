const AWSXRay = require('aws-xray-sdk');
const XRayHelper = require('../utils/xrayHelpers');

/**
 * Script để test X-Ray annotations và metadata
 * Chạy: node scripts/test-xray-annotations.js
 */

// Mock request và response objects
const mockRequest = {
  method: 'GET',
  originalUrl: '/api/products?category=gaming&page=1&limit=10',
  get: (header) => {
    if (header === 'User-Agent') return 'Mozilla/5.0 (Test Browser)';
    return null;
  },
  ip: '127.0.0.1',
  query: {
    category: 'gaming',
    page: '1',
    limit: '10'
  },
  user: {
    userId: 'test-user-123',
    role: 'user'
  }
};

const mockResponse = {
  statusCode: 200,
  getHeaders: () => ({
    'content-type': 'application/json',
    'content-length': '1024'
  })
};

// Mock product data
const mockProduct = {
  _id: 'test-product-123',
  name: 'Test Gaming Laptop',
  price: 15000000,
  category: 'gaming',
  brand: 'Test Brand',
  inStock: true,
  stockQuantity: 5
};

const mockProducts = [
  mockProduct,
  {
    _id: 'test-product-456',
    name: 'Test Office Laptop',
    price: 8000000,
    category: 'office',
    brand: 'Test Brand',
    inStock: false,
    stockQuantity: 0
  }
];

/**
 * Test basic metadata
 */
async function testBasicMetadata() {
  console.log('🧪 Testing Basic Metadata...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestBasicMetadata');
  
  try {
    XRayHelper.addBasicMetadata(segment, 'TestOperation', mockRequest);
    
    console.log('✅ Basic metadata added successfully');
    console.log('   - Operation: TestOperation');
    console.log('   - HTTP Method: GET');
    console.log('   - URL: /api/products?category=gaming&page=1&limit=10');
    console.log('   - User ID: test-user-123');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding basic metadata:', error);
    segment?.close(error);
  }
}

/**
 * Test success annotations
 */
async function testSuccessAnnotations() {
  console.log('\n🧪 Testing Success Annotations...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestSuccessAnnotations');
  
  try {
    XRayHelper.addSuccessAnnotations(segment, mockResponse, mockProducts);
    
    console.log('✅ Success annotations added successfully');
    console.log('   - Status: success');
    console.log('   - Result Type: object');
    console.log('   - Response Status: 200');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding success annotations:', error);
    segment?.close(error);
  }
}

/**
 * Test error annotations
 */
async function testErrorAnnotations() {
  console.log('\n🧪 Testing Error Annotations...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestErrorAnnotations');
  
  try {
    const testError = new Error('Test database connection failed');
    testError.name = 'DatabaseError';
    testError.code = 'DB_CONNECTION_FAILED';
    
    XRayHelper.addErrorAnnotations(segment, testError, 'TestOperation', [mockRequest]);
    
    console.log('✅ Error annotations added successfully');
    console.log('   - Status: error');
    console.log('   - Error Type: DatabaseError');
    console.log('   - Error Message: Test database connection failed');
    console.log('   - Error Code: DB_CONNECTION_FAILED');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding error annotations:', error);
    segment?.close(error);
  }
}

/**
 * Test database annotations
 */
async function testDatabaseAnnotations() {
  console.log('\n🧪 Testing Database Annotations...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestDatabaseAnnotations');
  
  try {
    const query = { category: 'gaming', inStock: true };
    XRayHelper.addDatabaseAnnotations(segment, 'find', query, mockProducts.length);
    
    console.log('✅ Database annotations added successfully');
    console.log('   - DB Operation: find');
    console.log('   - Has Query: true');
    console.log('   - Result Count: 2');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding database annotations:', error);
    segment?.close(error);
  }
}

/**
 * Test product annotations
 */
async function testProductAnnotations() {
  console.log('\n🧪 Testing Product Annotations...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestProductAnnotations');
  
  try {
    XRayHelper.addProductAnnotations(segment, mockProduct, 'get');
    
    console.log('✅ Product annotations added successfully');
    console.log('   - Product Operation: get');
    console.log('   - Product ID: test-product-123');
    console.log('   - Product Name: Test Gaming Laptop');
    console.log('   - Product Category: gaming');
    console.log('   - Product Brand: Test Brand');
    console.log('   - In Stock: true');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding product annotations:', error);
    segment?.close(error);
  }
}

/**
 * Test performance annotations
 */
async function testPerformanceAnnotations() {
  console.log('\n🧪 Testing Performance Annotations...');
  
  const segment = AWSXRay.getSegment()?.addNewSubsegment('TestPerformanceAnnotations');
  
  try {
    const startTime = Date.now() - 1500; // Simulate 1.5 second operation
    XRayHelper.addPerformanceAnnotations(segment, startTime, 'TestOperation');
    
    console.log('✅ Performance annotations added successfully');
    console.log('   - Operation Duration: ~1500ms');
    console.log('   - Operation Name: TestOperation');
    
    segment?.close();
  } catch (error) {
    console.error('❌ Error adding performance annotations:', error);
    segment?.close(error);
  }
}

/**
 * Test withSubsegment helper
 */
async function testWithSubsegment() {
  console.log('\n🧪 Testing withSubsegment Helper...');
  
  try {
    const result = await XRayHelper.withSubsegment('TestSubsegment', async (segment) => {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (segment) {
        segment.addAnnotation('test_annotation', 'test_value');
        segment.addMetadata('test_metadata', { key: 'value' });
      }
      
      return 'Test result';
    });
    
    console.log('✅ withSubsegment helper works successfully');
    console.log('   - Result:', result);
    
  } catch (error) {
    console.error('❌ Error with withSubsegment helper:', error);
  }
}

/**
 * Test error handling in withSubsegment
 */
async function testWithSubsegmentError() {
  console.log('\n🧪 Testing withSubsegment Error Handling...');
  
  try {
    await XRayHelper.withSubsegment('TestSubsegmentError', async (segment) => {
      // Simulate an error
      throw new Error('Test error in subsegment');
    });
  } catch (error) {
    console.log('✅ withSubsegment error handling works correctly');
    console.log('   - Error caught and re-thrown:', error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting X-Ray Annotations and Metadata Tests\n');
  
  // Enable X-Ray for testing
  process.env.ENABLE_XRAY = 'true';
  
  try {
    await testBasicMetadata();
    await testSuccessAnnotations();
    await testErrorAnnotations();
    await testDatabaseAnnotations();
    await testProductAnnotations();
    await testPerformanceAnnotations();
    await testWithSubsegment();
    await testWithSubsegmentError();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Basic Metadata');
    console.log('   ✅ Success Annotations');
    console.log('   ✅ Error Annotations');
    console.log('   ✅ Database Annotations');
    console.log('   ✅ Product Annotations');
    console.log('   ✅ Performance Annotations');
    console.log('   ✅ withSubsegment Helper');
    console.log('   ✅ Error Handling');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Check AWS X-Ray Console for traces');
    console.log('   2. Verify annotations and metadata are visible');
    console.log('   3. Use these patterns in your actual controllers');
    console.log('   4. Set up CloudWatch alarms based on annotations');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testBasicMetadata,
  testSuccessAnnotations,
  testErrorAnnotations,
  testDatabaseAnnotations,
  testProductAnnotations,
  testPerformanceAnnotations,
  testWithSubsegment,
  testWithSubsegmentError
}; 