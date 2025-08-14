const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Create initial admin user
const createInitialAdmin = async () => {
    const usersFile = path.join(__dirname, 'users.json');
    
    // Check if users file exists
    if (!fs.existsSync(usersFile)) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = {
            id: 1,
            username: 'admin',
            email: 'admin@ankjyotish.com',
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        fs.writeFileSync(usersFile, JSON.stringify([adminUser], null, 2));
        console.log('Initial admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('Please change the password after first login.');
    } else {
        console.log('Users file already exists. Skipping initial admin creation.');
    }
};

// Run the setup
createInitialAdmin().catch(console.error);
