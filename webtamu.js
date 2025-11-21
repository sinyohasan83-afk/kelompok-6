// webtamu.js - Logika untuk Sistem Buku Tamu Online

// --- Data Storage ---
let currentUser = null;
let users = [
    {
        id: 1,
        name: 'Administrator',
        email: 'admin@buku.com',
        password: 'admin123',
        phone: '081234567890',
        address: 'Jakarta',
        role: 'admin',
        status: 'active'
    },
    {
        id: 2,
        name: 'User Demo',
        email: 'user@buku.com',
        password: 'user123',
        phone: '081234567891',
        address: 'Bandung',
        role: 'user',
        status: 'active'
    }
];

let guestbookEntries = [];
let nextEntryId = 1;
let nextUserId = 3;

// Custom Confirmation Modal Logic
let confirmCallback = null;

function showConfirmationModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmCallback = callback;
    // Optionally change confirm button style based on context (e.g., danger for delete/logout)
    const actionBtn = document.getElementById('confirmActionBtn');
    actionBtn.className = title.includes('Hapus') || title.includes('Logout') ? 'btn btn-danger' : 'btn btn-primary';
    actionBtn.textContent = title.includes('Hapus') ? 'Ya, Hapus' : 'Ya, Lanjutkan';
    document.getElementById('confirmationModal').classList.add('active');
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').classList.remove('active');
    confirmCallback = null;
}

document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for the custom confirmation action button
    document.getElementById('confirmActionBtn').addEventListener('click', function() {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirmationModal();
    });
});
// End Custom Confirmation Modal Logic


// --- Utility Functions ---

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('id-ID', options);
}

function showAlert(elementId, message, type) {
    const alert = document.getElementById(elementId);
    if (!alert) return;

    alert.className = `alert alert-${type} show`;
    alert.textContent = message;

    setTimeout(() => {
        alert.classList.remove('show');
    }, 5000);
}

function saveEntries() {
    localStorage.setItem('guestbookEntries', JSON.stringify(guestbookEntries));
}

function saveUsers() {
    localStorage.setItem('users', JSON.stringify(users));
}

// Helper function for filtering (used by loadAllEntries and printEntries)
function filterAndSearchEntries(searchTerm, statusFilter, dateFilter) {
     const searchLower = searchTerm.toLowerCase();
     return guestbookEntries.filter(entry => {
        const matchSearch = entry.guestName.toLowerCase().includes(searchLower) ||
                             entry.institution.toLowerCase().includes(searchLower) ||
                             entry.purpose.toLowerCase().includes(searchLower);
        
        const matchStatus = !statusFilter || entry.status === statusFilter;
        
        let matchDate = true;
        if (dateFilter) {
            const entryDate = new Date(entry.date);
            const now = new Date();
            if (dateFilter === 'today') {
                matchDate = entryDate.toDateString() === now.toDateString();
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchDate = entryDate >= weekAgo;
            } else if (dateFilter === 'month') {
                matchDate = entryDate.getMonth() === now.getMonth() && 
                            entryDate.getFullYear() === now.getFullYear();
            }
        }

        return matchSearch && matchStatus && matchDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by newest first
}


// --- Main Application Logic Functions ---

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Load saved data
    const savedEntries = localStorage.getItem('guestbookEntries');
    if (savedEntries) {
        guestbookEntries = JSON.parse(savedEntries);
        nextEntryId = Math.max(...guestbookEntries.map(e => e.id), 0) + 1;
    }

    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
        // Ensure default users are present if list is empty or smaller than default count
        const loadedUsers = JSON.parse(savedUsers);
        if (loadedUsers.length > 0) {
            users = loadedUsers;
        }
        nextUserId = Math.max(...users.map(u => u.id), 0) + 1;
    }

    // Check if user is logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }
    
    // Attach all event listeners
    attachEventListeners();
});

// Attach all form submission and filter/search event listeners
function attachEventListeners() {
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('guestbookForm')?.addEventListener('submit', handleGuestbookSubmit);
    document.getElementById('editForm')?.addEventListener('submit', handleEditSubmit);
    document.getElementById('profileForm')?.addEventListener('submit', handleProfileUpdate);
    document.getElementById('passwordForm')?.addEventListener('submit', handlePasswordChange);

    // Filter/Search Listeners (Admin sections might not exist for regular users)
    document.getElementById('searchEntries')?.addEventListener('input', loadAllEntries);
    document.getElementById('filterStatus')?.addEventListener('change', loadAllEntries);
    document.getElementById('filterDate')?.addEventListener('change', loadAllEntries);
    document.getElementById('searchUsers')?.addEventListener('input', loadUsers);
    document.getElementById('filterRole')?.addEventListener('change', loadUsers);
}


// Login Handler
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const user = users.find(u => u.email === email && u.password === password);

    if (user && user.status === 'active') {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showAlert('loginAlert', 'Login berhasil! Mengalihkan...', 'success');
        setTimeout(() => {
            showMainApp();
        }, 1000);
    } else {
        showAlert('loginAlert', 'Email atau password salah, atau akun Anda belum aktif!', 'error');
    }
}

// Register Handlers (exposed globally for HTML onclick)
window.showRegisterForm = function() {
    document.getElementById('registerModal').classList.add('active');
}

window.closeRegisterModal = function() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerForm').reset();
    document.getElementById('registerAlert').classList.remove('show'); 
}

function handleRegister(e) {
    e.preventDefault();

    const newUser = {
        id: nextUserId++,
        name: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value,
        phone: document.getElementById('regPhone').value,
        address: document.getElementById('regAddress').value,
        role: 'user',
        status: 'active'
    };

    // Check if email exists
    if (users.find(u => u.email === newUser.email)) {
        showAlert('registerAlert', 'Email sudah terdaftar!', 'error');
        return;
    }

    users.push(newUser);
    saveUsers();
    showAlert('registerAlert', 'Registrasi berhasil! Silakan login.', 'success');
    
    setTimeout(() => {
        closeRegisterModal();
    }, 1500);
}

// Logout Handler (exposed globally for HTML onclick)
window.logout = function() {
    showConfirmationModal('Konfirmasi Logout', 'Yakin ingin logout dari sistem?', () => {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('loginForm').reset();
        closeMenu();
    });
}

// Show Main App
function showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Update nav user info
    document.getElementById('navUserName').textContent = currentUser.name;
    document.getElementById('navUserRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'User';
    document.getElementById('navUserAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Show/hide admin menu items
    if (currentUser.role === 'admin') {
        document.getElementById('usersMenuItem').style.display = 'flex';
    } else {
        document.getElementById('usersMenuItem').style.display = 'none';
    }

    // Load profile data
    loadProfileData();

    // Update dashboard and data views
    updateDashboard();
    loadRecentEntries();
    loadAllEntries();
    loadMyEntries();
    loadUsers();
    
    // Set dashboard as active initially
    navigateTo('dashboard', document.querySelector('#navMenu .nav-item:nth-child(2)'));
}

// Menu Toggle (exposed globally for HTML onclick)
window.toggleMenu = function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');
    
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    
    // Toggle blur on main content wrapper
    document.body.classList.toggle('content-blurred');
}

// Close Menu (exposed globally for HTML onclick)
window.closeMenu = function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');
    
    menuToggle.classList.remove('active');
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    
    // Remove blur
    document.body.classList.remove('content-blurred');
}

// Section Navigation (exposed globally for HTML onclick)
window.navigateTo = function(sectionId, targetElement) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Set active class on the button that was clicked
    if (targetElement) {
        targetElement.classList.add('active');
    } else {
        // Fallback for initial load
        const defaultActive = document.querySelector(`.nav-menu button[onclick*="'${sectionId}'"]`);
        if (defaultActive) defaultActive.classList.add('active');
    }

    closeMenu();
}

// Guestbook Form Submission
function handleGuestbookSubmit(e) {
    e.preventDefault();

    const entry = {
        id: nextEntryId++,
        userId: currentUser.id,
        userName: currentUser.name,
        guestName: document.getElementById('guestName').value,
        email: document.getElementById('guestEmail').value,
        phone: document.getElementById('guestPhone').value,
        institution: document.getElementById('guestInstitution').value,
        purpose: document.getElementById('guestPurpose').value,
        meetWith: document.getElementById('guestMeetWith').value,
        date: new Date().toISOString(),
        // Admin entries are approved immediately, user entries are pending
        status: currentUser.role === 'admin' ? 'approved' : 'pending' 
    };

    guestbookEntries.unshift(entry);
    saveEntries();

    showAlert('mainAlert', 'Entri berhasil disimpan!' + (entry.status === 'pending' ? ' Menunggu approval Admin.' : ''), 'success');
    this.reset();

    updateDashboard();
    loadRecentEntries();
    loadAllEntries();
    loadMyEntries();
}

// Load All Entries
function loadAllEntries() {
    const tbody = document.getElementById('entriesTable');
    if (!tbody) return; // Prevent error if the section is not visible/rendered

    const searchTerm = document.getElementById('searchEntries').value || '';
    const statusFilter = document.getElementById('filterStatus').value || '';
    const dateFilter = document.getElementById('filterDate').value || '';

    let filtered = filterAndSearchEntries(searchTerm, statusFilter, dateFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--color-text-muted);">Tidak ada entri</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.guestName}</td>
            <td>${entry.email}</td>
            <td>${entry.institution}</td>
            <td>${entry.purpose.substring(0, 50)}${entry.purpose.length > 50 ? '...' : ''}</td>
            <td>${entry.meetWith}</td>
            <td><span class="badge badge-${entry.status}">${entry.status === 'pending' ? 'Pending' : 'Approved'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="viewEntry(${entry.id})">Lihat</button>
                    ${currentUser.role === 'admin' || entry.userId === currentUser.id ? 
                        `<button class="btn btn-secondary btn-sm" onclick="editEntry(${entry.id})">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteEntry(${entry.id})">Hapus</button>` : ''}
                    ${currentUser.role === 'admin' && entry.status === 'pending' ? 
                        `<button class="btn btn-success btn-sm" onclick="approveEntry(${entry.id})">Approve</button>` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Load My Entries
function loadMyEntries() {
    const tbody = document.getElementById('myEntriesTable');
    if (!tbody) return;

    const myEntries = guestbookEntries.filter(e => e.userId === currentUser.id).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (myEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--color-text-muted);">Belum ada entri</td></tr>';
        return;
    }

    tbody.innerHTML = myEntries.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.guestName}</td>
            <td>${entry.institution}</td>
            <td>${entry.purpose.substring(0, 50)}${entry.purpose.length > 50 ? '...' : ''}</td>
            <td><span class="badge badge-${entry.status}">${entry.status === 'pending' ? 'Pending' : 'Approved'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-primary btn-sm" onclick="viewEntry(${entry.id})">Lihat</button>
                    <button class="btn btn-secondary btn-sm" onclick="editEntry(${entry.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEntry(${entry.id})">Hapus</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load Recent Entries
function loadRecentEntries() {
    const tbody = document.getElementById('recentEntriesTable');
    if (!tbody) return;
    
    const recent = guestbookEntries.slice(0, 5);

    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--color-text-muted);">Belum ada entri</td></tr>';
        return;
    }

    tbody.innerHTML = recent.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.guestName}</td>
            <td>${entry.institution}</td>
            <td>${entry.purpose.substring(0, 30)}${entry.purpose.length > 30 ? '...' : ''}</td>
            <td><span class="badge badge-${entry.status}">${entry.status === 'pending' ? 'Pending' : 'Approved'}</span></td>
        </tr>
    `).join('');
}

// Update Dashboard
function updateDashboard() {
    const today = new Date().toDateString();
    
    document.getElementById('totalEntries').textContent = guestbookEntries.length;
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('pendingEntries').textContent = 
        guestbookEntries.filter(e => e.status === 'pending').length;
    document.getElementById('todayEntries').textContent = 
        guestbookEntries.filter(e => new Date(e.date).toDateString() === today).length;
}

// View Entry (exposed globally for HTML onclick)
window.viewEntry = function(id) {
    const entry = guestbookEntries.find(e => e.id === id);
    if (!entry) return;

    const content = `
        <div style="line-height: 1.8; color: var(--color-text-muted);">
            <p style="color: var(--color-text);"><strong>Tanggal:</strong> ${formatDate(entry.date)}</p>
            <p style="color: var(--color-text);"><strong>Nama Tamu:</strong> ${entry.guestName}</p>
            <p style="color: var(--color-text);"><strong>Email:</strong> ${entry.email}</p>
            <p style="color: var(--color-text);"><strong>Telepon:</strong> ${entry.phone}</p>
            <p style="color: var(--color-text);"><strong>Institusi:</strong> ${entry.institution}</p>
            <p style="color: var(--color-text);"><strong>Bertemu Dengan:</strong> ${entry.meetWith}</p>
            <p style="color: var(--color-text);"><strong>Status:</strong> <span class="badge badge-${entry.status}">${entry.status === 'pending' ? 'Pending' : 'Approved'}</span></p>
            <p style="color: var(--color-text);"><strong>Dibuat Oleh:</strong> ${entry.userName}</p>
            <div style="margin-top: 1rem; padding: 1rem; border: 1px solid rgba(0, 242, 255, 0.1); border-radius: 8px;">
                <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;">Keperluan Detail:</h4>
                <p style="white-space: pre-wrap; color: var(--color-text);">${entry.purpose}</p>
            </div>
        </div>
    `;

    document.getElementById('viewModalContent').innerHTML = content;
    document.getElementById('viewModal').classList.add('active');
}

// Close View Modal (exposed globally for HTML onclick)
window.closeViewModal = function() {
    document.getElementById('viewModal').classList.remove('active');
}

// Edit Entry (exposed globally for HTML onclick)
window.editEntry = function(id) {
    const entry = guestbookEntries.find(e => e.id === id);
    if (!entry) return;

    document.getElementById('editEntryId').value = entry.id;
    document.getElementById('editGuestName').value = entry.guestName;
    document.getElementById('editGuestEmail').value = entry.email;
    document.getElementById('editGuestPhone').value = entry.phone;
    document.getElementById('editGuestInstitution').value = entry.institution;
    document.getElementById('editGuestPurpose').value = entry.purpose;
    document.getElementById('editGuestMeetWith').value = entry.meetWith;

    document.getElementById('editModal').classList.add('active');
}

// Close Edit Modal (exposed globally for HTML onclick)
window.closeEditModal = function() {
    document.getElementById('editModal').classList.remove('active');
}

// Edit Form Submission
function handleEditSubmit(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editEntryId').value);
    const entry = guestbookEntries.find(e => e.id === id);

    if (entry) {
        entry.guestName = document.getElementById('editGuestName').value;
        entry.email = document.getElementById('editGuestEmail').value;
        entry.phone = document.getElementById('editGuestPhone').value;
        entry.institution = document.getElementById('editGuestInstitution').value;
        entry.purpose = document.getElementById('editGuestPurpose').value;
        entry.meetWith = document.getElementById('editGuestMeetWith').value;

        saveEntries();
        loadAllEntries();
        loadMyEntries();
        loadRecentEntries();

        closeEditModal();
        showAlert('mainAlert', 'Entri berhasil diupdate!', 'success');
    }
}

// Delete Entry (exposed globally for HTML onclick)
window.deleteEntry = function(id) {
    showConfirmationModal('Hapus Entri', 'Anda yakin ingin menghapus entri buku tamu ini?', () => {
        guestbookEntries = guestbookEntries.filter(e => e.id !== id);
        saveEntries();
        loadAllEntries();
        loadMyEntries();
        loadRecentEntries();
        updateDashboard();
        showAlert('mainAlert', 'Entri berhasil dihapus!', 'success');
    });
}

// Approve Entry (exposed globally for HTML onclick)
window.approveEntry = function(id) {
    const entry = guestbookEntries.find(e => e.id === id);
    if (entry) {
        showConfirmationModal('Approve Entri', `Yakin ingin menyetujui entri tamu dari ${entry.guestName}?`, () => {
            entry.status = 'approved';
            saveEntries();
            loadAllEntries();
            updateDashboard();
            showAlert('mainAlert', 'Entri berhasil di-approve!', 'success');
        });
    }
}

// Users Management
function loadUsers() {
    const tbody = document.getElementById('usersTable');
    if (!tbody || currentUser.role !== 'admin') return; 

    const searchTerm = document.getElementById('searchUsers')?.value.toLowerCase() || '';
    const roleFilter = document.getElementById('filterRole')?.value || '';

    let filtered = users.filter(user => {
        const matchSearch = user.name.toLowerCase().includes(searchTerm) ||
                             user.email.toLowerCase().includes(searchTerm);
        const matchRole = !roleFilter || user.role === roleFilter;
        return matchSearch && matchRole;
    });

    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><span class="badge badge-${user.role}">${user.role === 'admin' ? 'Admin' : 'User'}</span></td>
            <td><span class="badge badge-${user.status === 'active' ? 'approved' : 'pending'}">${user.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
            <td>
                <div class="action-btns">
                    ${user.id !== currentUser.id ? 
                        `<button class="btn btn-${user.status === 'active' ? 'warning' : 'success'} btn-sm" 
                            onclick="toggleUserStatus(${user.id})">
                            ${user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        ${user.role !== 'admin' ? 
                            `<button class="btn btn-primary btn-sm" onclick="promoteToAdmin(${user.id})">Jadikan Admin</button>` : 
                            `<button class="btn btn-secondary btn-sm" onclick="demoteToUser(${user.id})">Jadikan User</button>`
                        }` : '<em>Akun Anda</em>'}
                </div>
            </td>
        </tr>
    `).join('');
}

// Toggle User Status (exposed globally for HTML onclick)
window.toggleUserStatus = function(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = user.status === 'active' ? 'menonaktifkan' : 'mengaktifkan';
        
        showConfirmationModal('Ubah Status User', `Yakin ingin ${action} akun ${user.name}?`, () => {
            user.status = newStatus;
            saveUsers();
            loadUsers();
            showAlert('mainAlert', `User berhasil ${newStatus === 'active' ? 'diaktifkan' : 'dinonaktifkan'}!`, 'success');
        });
    }
}

// Promote to Admin (exposed globally for HTML onclick)
window.promoteToAdmin = function(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        showConfirmationModal('Promosikan User', `Yakin ingin menjadikan user ${user.name} sebagai admin? User akan memiliki akses penuh.`, () => {
            user.role = 'admin';
            saveUsers();
            loadUsers();
            showAlert('mainAlert', 'User berhasil dijadikan admin!', 'success');
        });
    }
}

// Demote to User (exposed globally for HTML onclick)
window.demoteToUser = function(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        showConfirmationModal('Turunkan Role', `Yakin ingin menurunkan role admin ${user.name} menjadi user biasa?`, () => {
            user.role = 'user';
            saveUsers();
            loadUsers();
            showAlert('mainAlert', 'Admin berhasil dijadikan user!', 'success');
        });
    }
}

// Profile Settings
function loadProfileData() {
    if (!currentUser) return;
    document.getElementById('profileName').value = currentUser.name;
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = currentUser.phone;
    document.getElementById('profileAddress').value = currentUser.address || '';
}

// Profile Form Submission
function handleProfileUpdate(e) {
    e.preventDefault();

    currentUser.name = document.getElementById('profileName').value;
    currentUser.email = document.getElementById('profileEmail').value;
    currentUser.phone = document.getElementById('profilePhone').value;
    currentUser.address = document.getElementById('profileAddress').value;

    // Update in users array
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...currentUser }; // Ensure full copy
        saveUsers();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Update UI (Hanya di Nav Menu)
    document.getElementById('navUserName').textContent = currentUser.name;
    document.getElementById('navUserAvatar').textContent = currentUser.name.charAt(0).toUpperCase();

    showAlert('mainAlert', 'Profil berhasil diupdate!', 'success');
}

// Password Change Submission
function handlePasswordChange(e) {
    e.preventDefault();

    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (oldPassword !== currentUser.password) {
        showAlert('mainAlert', 'Password lama tidak sesuai!', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('mainAlert', 'Konfirmasi password tidak sesuai!', 'error');
        return;
    }

    if (newPassword.length < 6) {
        showAlert('mainAlert', 'Password minimal 6 karakter!', 'error');
        return;
    }

    currentUser.password = newPassword;
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        saveUsers();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    this.reset();
    showAlert('mainAlert', 'Password berhasil diubah!', 'success');
}

// Export Functions (exposed globally for HTML onclick)
window.exportToCSV = function() {
    const headers = ['Tanggal', 'Nama Tamu', 'Email', 'Telepon', 'Institusi', 'Keperluan', 'Bertemu Dengan', 'Status', 'Dibuat Oleh'];
    const rows = guestbookEntries.map(entry => [
        formatDate(entry.date),
        entry.guestName,
        entry.email,
        entry.phone,
        entry.institution,
        // Escape quotes in purpose for CSV
        entry.purpose.replace(/"/g, '""'), 
        entry.meetWith,
        entry.status,
        entry.userName
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buku-tamu-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showAlert('mainAlert', 'Data berhasil di-export ke CSV!', 'success');
}

window.exportToPDF = function() {
    showAlert('mainAlert', 'Fitur export PDF menggunakan fitur cetak browser. Silakan pilih "Simpan sebagai PDF" di dialog cetak.', 'info');
    setTimeout(() => {
        printEntries();
    }, 1500);
}

window.printEntries = function() {
    const searchTerm = document.getElementById('searchEntries')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    const dateFilter = document.getElementById('filterDate')?.value || '';
    
    // Get filtered entries to be printed (simulating current view)
    const filteredEntries = filterAndSearchEntries(
        searchTerm,
        statusFilter,
        dateFilter
    );

    const tableRows = filteredEntries.map(entry => `
        <tr>
            <td>${formatDate(entry.date)}</td>
            <td>${entry.guestName}</td>
            <td>${entry.email}</td>
            <td>${entry.institution}</td>
            <td>${entry.purpose.substring(0, 100)}...</td>
            <td>${entry.status === 'pending' ? 'Pending' : 'Approved'}</td>
        </tr>
    `).join('');

    const printWindow = window.open('', '', 'height=600,width=800');
    const content = `
        <html>
        <head>
            <title>Buku Tamu Online - Print</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; color: #0a0e27; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #00f2ff; color: #0a0e27; }
                tr:nth-child(even) { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>📖 Buku Tamu Online</h1>
            <p>Tanggal Cetak: ${formatDate(new Date().toISOString())}</p>
            <table>
                <thead>
                    <tr>
                        <th>Tanggal</th>
                        <th>Nama</th>
                        <th>Email</th>
                        <th>Institusi</th>
                        <th>Keperluan</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </body>
        </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
}