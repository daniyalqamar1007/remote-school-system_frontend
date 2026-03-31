// Test Parent Login Endpoints
// Run this in the browser console

async function testParentLogin() {
  const credentials = {
    email: 'parent@defaultschool.edu',
    password: '123'
  };

  console.log('🔐 Testing Parent Login Endpoints...\n');

  // Test 1: /auth/login endpoint
  try {
    console.log('1️⃣ Testing /auth/login...');
    const authResponse = await fetch('http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('   ✅ /auth/login SUCCESS:', authData);
    } else {
      const authError = await authResponse.text();
      console.log('   ❌ /auth/login FAILED:', authResponse.status, authError);
    }
  } catch (err) {
    console.log('   ❌ /auth/login ERROR:', err);
  }

  console.log('');

  // Test 2: /user/login endpoint with PARENT role
  try {
    console.log('2️⃣ Testing /user/login with PARENT role...');
    const userResponse = await fetch('http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...credentials,
        role: 'PARENT'
      })
    });

    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('   ✅ /user/login SUCCESS:', userData);
      
      // Test storing the data
      if (userData.user) {
        localStorage.setItem('parentId', userData.user._id || userData.user.id);
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('role', 'PARENT');
        localStorage.setItem('userInfo', JSON.stringify(userData.user));
        console.log('   💾 Stored auth data in localStorage');
      }
    } else {
      const userError = await userResponse.text();
      console.log('   ❌ /user/login FAILED:', userResponse.status, userError);
    }
  } catch (err) {
    console.log('   ❌ /user/login ERROR:', err);
  }

  console.log('');

  // Test 3: Alternative credentials
  const altCredentials = {
    email: 'parent@example.com',
    password: '123'
  };

  try {
    console.log('3️⃣ Testing /user/login with alternative credentials...');
    const altResponse = await fetch('http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...altCredentials,
        role: 'PARENT'
      })
    });

    if (altResponse.ok) {
      const altData = await altResponse.json();
      console.log('   ✅ Alternative login SUCCESS:', altData);
    } else {
      const altError = await altResponse.text();
      console.log('   ❌ Alternative login FAILED:', altResponse.status, altError);
    }
  } catch (err) {
    console.log('   ❌ Alternative login ERROR:', err);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('===================');
  console.log('If /user/login worked:');
  console.log('  → Use: parent@defaultschool.edu / password: 123');
  console.log('  → Login via: /user/login with role: PARENT');
  console.log('');
  console.log('If /auth/login worked:');
  console.log('  → The parent needs to be in the Users collection');
  console.log('  → Use: /auth/login endpoint');
}

// Auto-run the test
testParentLogin();
