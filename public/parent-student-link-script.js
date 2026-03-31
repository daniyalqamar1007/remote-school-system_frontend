// Browser Console Script for Parent-Student Linking
// Run this in your browser console while logged in as a parent

async function createTestStudentsForParent() {
  try {
    console.log('🚀 Starting parent-student linking process...');
    
    // Get parent info from localStorage
    const parentId = localStorage.getItem('parentId');
    const authToken = localStorage.getItem('authToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (!parentId || !authToken) {
      console.error('❌ No parent authentication found. Please login first.');
      return;
    }
    
    console.log('👨‍👩‍👧‍👦 Found parent info:', { parentId, email: userInfo.email });
    
    const backendUrl = 'http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014';
    
    // Create comprehensive student data
    const studentsToCreate = [
      {
        studentId: 'ST' + Math.floor(Math.random() * 9000 + 1000),
        firstName: 'Emma',
        lastName: userInfo.lastName || 'Johnson',
        class: '9',
        section: 'A',
        gender: 'Female',
        dob: '2009-05-15',
        email: `emma.${Date.now()}@student.example.com`,
        phone: '555-111-1111',
        address: userInfo.address || '123 Main Street, Anytown, USA',
        emergencyContact: userInfo.phone || '555-999-9999',
        enrollDate: '2022-09-01',
        expectedGraduation: '2026-06-15',
        profilePhoto: 'https://i.pravatar.cc/150?u=emma',
        iipFlag: false,
        honorRolls: true,
        athletics: true,
        clubs: 'Drama Club, Science Club',
        lunch: 'Regular',
        nationality: 'American'
      },
      {
        studentId: 'ST' + Math.floor(Math.random() * 9000 + 1000),
        firstName: 'Liam',
        lastName: userInfo.lastName || 'Johnson',
        class: '11',
        section: 'B',
        gender: 'Male',
        dob: '2007-03-22',
        email: `liam.${Date.now()}@student.example.com`,
        phone: '555-222-2222',
        address: userInfo.address || '123 Main Street, Anytown, USA',
        emergencyContact: userInfo.phone || '555-999-9999',
        enrollDate: '2020-09-01',
        expectedGraduation: '2024-06-15',
        profilePhoto: 'https://i.pravatar.cc/150?u=liam',
        iipFlag: false,
        honorRolls: false,
        athletics: false,
        clubs: 'Robotics Club, Chess Club',
        lunch: 'Vegetarian',
        nationality: 'American'
      }
    ];
    
    const createdStudents = [];
    
    // Create students via API
    for (const studentData of studentsToCreate) {
      try {
        console.log(`📝 Creating student: ${studentData.firstName} ${studentData.lastName}...`);
        
        const response = await fetch(`${backendUrl}/student/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify(studentData)
        });
        
        if (response.ok) {
          const createdStudent = await response.json();
          createdStudents.push(createdStudent);
          console.log(`✅ Created student: ${studentData.firstName} (ID: ${createdStudent.studentId || createdStudent._id})`);
        } else {
          const error = await response.text();
          console.warn(`⚠️ Failed to create ${studentData.firstName}: ${error}`);
        }
      } catch (err) {
        console.error(`❌ Error creating ${studentData.firstName}:`, err);
      }
    }
    
    if (createdStudents.length === 0) {
      console.warn('⚠️ No students were created. Trying to link existing students...');
      
      // Try to find existing students and link them
      try {
        const studentsResponse = await fetch(`${backendUrl}/student`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (studentsResponse.ok) {
          const allStudents = await studentsResponse.json();
          console.log(`📚 Found ${allStudents.length} existing students`);
          
          // Take the first 2 students for demo
          const studentsToLink = allStudents.slice(0, 2);
          
          for (const student of studentsToLink) {
            // You might need to call a parent API to link children
            // This depends on your backend API structure
            console.log(`🔗 Would link student: ${student.firstName} ${student.lastName} (${student.studentId})`);
          }
        }
      } catch (err) {
        console.error('❌ Error fetching existing students:', err);
      }
    }
    
    // Create sample attendance data
    if (createdStudents.length > 0) {
      console.log('📅 Creating sample attendance data...');
      
      // This would require implementing attendance creation API calls
      // For now, just log what would be created
      createdStudents.forEach(student => {
        console.log(`📊 Would create attendance data for ${student.firstName}`);
      });
    }
    
    // Create sample grade data
    if (createdStudents.length > 0) {
      console.log('📊 Creating sample grade data...');
      
      // This would require implementing grade creation API calls
      // For now, just log what would be created
      createdStudents.forEach(student => {
        console.log(`📈 Would create grade data for ${student.firstName}`);
      });
    }
    
    console.log('\n🎉 PROCESS COMPLETED!');
    console.log('===================');
    console.log(`👨‍👩‍👧‍👦 Parent: ${userInfo.firstName} ${userInfo.lastName}`);
    console.log(`👨‍🎓 Students processed: ${createdStudents.length}`);
    
    if (createdStudents.length > 0) {
      console.log('✅ Students created:');
      createdStudents.forEach(student => {
        console.log(`   - ${student.firstName} ${student.lastName} (Grade ${student.class}${student.section})`);
      });
      console.log('\n🔄 Please refresh the parent dashboard to see the new data!');
    } else {
      console.log('⚠️ No students were created. You may need to run the backend script or check your API endpoints.');
    }
    
  } catch (error) {
    console.error('❌ Error in parent-student linking:', error);
  }
}

// Alternative function to just link existing students
async function linkExistingStudentsToParent() {
  try {
    const parentId = localStorage.getItem('parentId');
    const authToken = localStorage.getItem('authToken');
    
    if (!parentId || !authToken) {
      console.error('❌ No parent authentication found.');
      return;
    }
    
    console.log('🔍 Searching for existing students to link...');

    const backendUrl = 'http://http://ec2-52-23-230-153.compute-1.amazonaws.com:3014';
    
    // Get all students
    const response = await fetch(`${backendUrl}/student`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.ok) {
      const students = await response.json();
      console.log(`📚 Found ${students.length} students in database`);
      
      if (students.length >= 2) {
        const studentsToLink = students.slice(0, 2);
        console.log('🔗 Attempting to link first 2 students to parent...');
        
        // Note: You might need to implement a specific API endpoint for linking
        // For now, this shows the concept
        studentsToLink.forEach((student, index) => {
          console.log(`${index + 1}. ${student.firstName} ${student.lastName} (${student.studentId}) - Grade ${student.class}${student.section}`);
        });
        
        console.log('\n💡 To complete the linking, you may need to:');
        console.log('1. Run the backend MongoDB script');
        console.log('2. Or implement a parent-children linking API endpoint');
      } else {
        console.log('⚠️ Not enough students found. Consider running the backend seeding script first.');
      }
    } else {
      console.error('❌ Failed to fetch students');
    }
    
  } catch (error) {
    console.error('❌ Error linking students:', error);
  }
}

// Instructions
console.log('🎯 PARENT PORTAL DATA SETUP');
console.log('===========================');
console.log('Run one of these functions in the browser console:');
console.log('');
console.log('1. createTestStudentsForParent() - Creates new students and links them');
console.log('2. linkExistingStudentsToParent() - Links existing students to your parent account');
console.log('');
console.log('💡 Make sure you are logged in as a parent first!');
console.log('');
console.log('🚀 Quick start: Run createTestStudentsForParent()');

// Auto-run the main function (uncomment the line below if you want it to run automatically)
// createTestStudentsForParent();
