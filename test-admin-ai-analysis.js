// Test script to verify admin AI analysis functionality
// This script helps verify that the getAllUsers API endpoint works correctly

const testGetAllUsers = async () => {
  try {
    console.log('Testing getAllUsers API endpoint...');
    
    // Test the users endpoint with skipPagination
    const response = await fetch('http://localhost:5000/api/users?skipPagination=true', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response structure:', Object.keys(data));
    console.log('Users array length:', data.users?.length || 0);
    console.log('First user sample:', data.users?.[0] ? {
      id: data.users[0]._id,
      name: data.users[0].name,
      email: data.users[0].email,
    } : 'No users found');
    
    return data;
  } catch (error) {
    console.error('Error testing getAllUsers:', error);
    return null;
  }
};

// Test the admin AI analysis screen data flow
const testAdminAiAnalysisDataFlow = () => {
  console.log('=== Admin AI Analysis Data Flow Test ===');
  
  // Simulate the data structure we expect
  const mockApiResponse = {
    users: [
      { _id: '1', name: 'John Doe', email: 'john@example.com' },
      { _id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    ],
    totalCount: 2,
    page: 1,
    pages: 1
  };
  
  console.log('Mock API Response:', mockApiResponse);
  
  // Test the filtering logic
  const usersArray = mockApiResponse?.users || [];
  const searchTerm = 'john';
  const filteredUsers = usersArray.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log('Filtered users (search: "john"):', filteredUsers);
  
  // Test user selection
  const selectedUserId = '1';
  const selectedUser = usersArray.find(user => user._id === selectedUserId);
  console.log('Selected user:', selectedUser);
  
  console.log('✅ Data flow test completed successfully');
};

// Run tests
console.log('Starting Admin AI Analysis tests...\n');
testAdminAiAnalysisDataFlow();

// Note: Uncomment the line below to test the actual API (requires running backend)
// testGetAllUsers();
