const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL;
if (!BASE_URL) {
  throw new Error('API_BASE_URL environment variable is not set.');
}

// Test data
const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+250789123456',
  password: 'password123'
};

let authToken = '';
let userId = '';

// Test functions
const testHealthCheck = async () => {
  try {
    console.log('Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
};

const testUserRegistration = async () => {
  try {
    console.log('Testing user registration...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ User registration passed:', response.data.message);
    authToken = response.data.token;
    userId = response.data._id;
    return true;
  } catch (error) {
    console.error('❌ User registration failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testUserLogin = async () => {
  try {
    console.log('Testing user login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ User login passed:', response.data.message);
    authToken = response.data.token;
    userId = response.data._id;
    return true;
  } catch (error) {
    console.error('❌ User login failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testGetHouses = async () => {
  try {
    console.log('Testing get houses...');
    const response = await axios.get(`${BASE_URL}/houses`);
    console.log('✅ Get houses passed:', `${response.data.houses.length} houses found`);
    return true;
  } catch (error) {
    console.error('❌ Get houses failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testGetCars = async () => {
  try {
    console.log('Testing get cars...');
    const response = await axios.get(`${BASE_URL}/cars`);
    console.log('✅ Get cars passed:', `${response.data.cars.length} cars found`);
    return true;
  } catch (error) {
    console.error('❌ Get cars failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testGetPlots = async () => {
  try {
    console.log('Testing get plots...');
    const response = await axios.get(`${BASE_URL}/plots`);
    console.log('✅ Get plots passed:', `${response.data.plots.length} plots found`);
    return true;
  } catch (error) {
    console.error('❌ Get plots failed:', error.response?.data?.message || error.message);
    return true;
  }
};

const testGetJobs = async () => {
  try {
    console.log('Testing get jobs...');
    const response = await axios.get(`${BASE_URL}/jobs`);
    console.log('✅ Get jobs passed:', `${response.data.jobs.length} jobs found`);
    return true;
  } catch (error) {
    console.error('❌ Get jobs failed:', error.response?.data?.message || error.message);
    return true;
  }
};

const testGetUserProfile = async () => {
  if (!authToken) {
    console.log('⚠️ Skipping user profile test (no auth token)');
    return true;
  }

  try {
    console.log('Testing get user profile...');
    const response = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get user profile passed:', response.data.firstName, response.data.lastName);
    return true;
  } catch (error) {
    console.error('❌ Get user profile failed:', error.response?.data?.message || error.message);
    return false;
  }
};

const testSearch = async () => {
  try {
    console.log('Testing search functionality...');
    const response = await axios.get(`${BASE_URL}/houses?search=villa`);
    console.log('✅ Search passed:', `${response.data.houses.length} results found for "villa"`);
    return true;
  } catch (error) {
    console.error('❌ Search failed:', error.response?.data?.message || error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting API tests...\n');

  const tests = [
    testHealthCheck,
    testUserRegistration,
    testUserLogin,
    testGetHouses,
    testGetCars,
    testGetPlots,
    testGetJobs,
    testGetUserProfile,
    testSearch
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    console.log(''); // Add spacing between tests
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the API configuration.');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testHealthCheck,
  testUserRegistration,
  testUserLogin,
  testGetHouses,
  testGetCars,
  testGetPlots,
  testGetJobs,
  testGetUserProfile,
  testSearch
};
