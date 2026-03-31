// Test Script for Parent-Student Data Verification
// Run this in the browser console after logging in

async function testParentStudentConnection() {
  try {
    console.log('🔍 Testing Parent-Student Data Connection...\n');
    
    // Check localStorage
    const parentId = localStorage.getItem('parentId');
    const authToken = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    console.log('📱 localStorage Data:');
    console.log('   parentId:', parentId);
    console.log('   authToken:', authToken ? 'Present ✅' : 'Missing ❌');
    console.log('   userInfo:', userInfo);
    console.log('');
    
    if (!parentId || !authToken) {
      console.error('❌ Missing authentication data. Please login first.');
      return;
    }
    const backendUrl = 'http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014';
    
    // Test API endpoints
    console.log('🔗 Testing API Endpoints...\n');
    
    // 1. Test parent info
    try {
      console.log('1️⃣ Testing parent info endpoint...');
      const parentResponse = await fetch(`${backendUrl}/parent/${parentId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (parentResponse.ok) {
        const parentData = await parentResponse.json();
        console.log('   ✅ Parent data:', parentData);
        console.log('   👶 Children IDs:', parentData.children);
      } else {
        console.log('   ❌ Parent endpoint failed:', parentResponse.status);
      }
    } catch (err) {
      console.log('   ❌ Parent endpoint error:', err);
    }
    
    console.log('');
    
    // 2. Test children full endpoint
    try {
      console.log('2️⃣ Testing children-full endpoint...');
      const childrenResponse = await fetch(`${backendUrl}/parent/${parentId}/children-full`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (childrenResponse.ok) {
        const childrenData = await childrenResponse.json();
        console.log('   ✅ Children data:', childrenData);
        console.log(`   👨‍🎓 Found ${childrenData.length} students:`);
        childrenData.forEach((student, index) => {
          console.log(`      ${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.class}${student.section}`);
        });
      } else {
        const errorText = await childrenResponse.text();
        console.log('   ❌ Children endpoint failed:', childrenResponse.status, errorText);
      }
    } catch (err) {
      console.log('   ❌ Children endpoint error:', err);
    }
    
    console.log('');
    
    // 3. Test a sample student's grades
    try {
      console.log('3️⃣ Testing student grades endpoint...');
      const childrenResponse = await fetch(`${backendUrl}/parent/${parentId}/children-full`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (childrenResponse.ok) {
        const students = await childrenResponse.json();
        if (students.length > 0) {
          const firstStudent = students[0];
          const gradesResponse = await fetch(`${backendUrl}/grade/by-student/${firstStudent._id}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (gradesResponse.ok) {
            const grades = await gradesResponse.json();
            console.log(`   ✅ Grades for ${firstStudent.firstName}:`, grades);
            console.log(`   📊 Found ${grades.length} grade records`);
          } else {
            console.log('   ⚠️ No grades found or grades endpoint failed');
          }
        } else {
          console.log('   ⚠️ No students to test grades for');
        }
      }
    } catch (err) {
      console.log('   ❌ Grades test error:', err);
    }
    
    console.log('');
    
    // 4. Test attendance data
    try {
      console.log('4️⃣ Testing student attendance...');
      const childrenResponse = await fetch(`${backendUrl}/parent/${parentId}/children-full`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (childrenResponse.ok) {
        const students = await childrenResponse.json();
        if (students.length > 0) {
          const firstStudent = students[0];
          
          // Try the student attendance endpoint
          const attendanceResponse = await fetch(`${backendUrl}/student/${firstStudent._id}/daily-attendance`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (attendanceResponse.ok) {
            const attendance = await attendanceResponse.json();
            console.log(`   ✅ Attendance for ${firstStudent.firstName}:`, attendance);
          } else {
            console.log('   ⚠️ No attendance found or attendance endpoint failed');
          }
        }
      }
    } catch (err) {
      console.log('   ❌ Attendance test error:', err);
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('==========');
    console.log('If you see ✅ marks above, your data is properly connected!');
    console.log('If you see ❌ marks, there might be an issue with the API or data.');
    console.log('\n💡 Next steps:');
    console.log('1. Refresh your parent dashboard page');
    console.log('2. Check if student data now appears');
    console.log('3. Navigate to other tabs like Attendance, Grades, etc.');
    
  } catch (error) {
    console.error('❌ Test script error:', error);
  }
}

// Auto-run the test
console.log('🚀 Parent-Student Connection Test Script Loaded!');
console.log('📋 Run testParentStudentConnection() to verify your data');
console.log('');

// Uncomment the line below to auto-run the test:
testParentStudentConnection();
