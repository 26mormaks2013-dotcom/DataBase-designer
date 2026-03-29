// Global state
let tables = [];
let activeTableId = null;
let selectedCell = null;
let currentUser = null;
let themes = [];
let fonts = [];

// Data types
const DATA_TYPES = ['INTEGER', 'TEXT', 'VARCHAR', 'BOOLEAN', 'DATE', 'DATETIME', 'FLOAT', 'DECIMAL', 'BLOB'];

// Local storage keys
const STORAGE_KEY = 'db_designer_schema';
const USER_KEY = 'db_designer_user';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    checkAuth();
    loadThemes();
    loadFonts();
    
    if (tables.length === 0) {
        loadTables();
    }
    
    // Setup form handlers
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
});

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
            loadUserSettings();
        }
    } catch (error) {
        console.log('Not authenticated');
    }
}

// Update user UI
function updateUserUI() {
    const userInfo = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userId = document.getElementById('userId');
    
    if (currentUser) {
        userInfo.style.display = 'flex';
        userAvatar.src = currentUser.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';
        userName.textContent = currentUser.username;
        userId.textContent = `ID: ${currentUser.id}`;
    } else {
        userInfo.style.display = 'none';
    }
}

// Load user settings
async function loadUserSettings() {
    if (!currentUser) return;
    
    try {
        const response = await fetch('/api/profile');
        if (response.ok) {
            const data = await response.json();
            const user = data.user;
            
            // Apply theme
            if (user.theme) {
                applyTheme(user.theme);
            }
            
            // Apply font
            if (user.font) {
                applyFont(user.font);
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load themes
async function loadThemes() {
    try {
        const response = await fetch('/api/themes');
        if (response.ok) {
            const data = await response.json();
            themes = data.themes;
            renderThemes();
        }
    } catch (error) {
        console.error('Error loading themes:', error);
    }
}

// Load fonts
async function loadFonts() {
    try {
        const response = await fetch('/api/fonts');
        if (response.ok) {
            const data = await response.json();
            fonts = data.fonts;
            renderFonts();
        }
    } catch (error) {
        console.error('Error loading fonts:', error);
    }
}

// Render themes
function renderThemes() {
    const grid = document.getElementById('themesGrid');
    grid.innerHTML = '';
    
    themes.forEach(theme => {
        const card = document.createElement('div');
        card.className = `theme-card ${currentUser?.theme === theme.id ? 'active' : ''}`;
        card.onclick = () => selectTheme(theme.id);
        
        card.innerHTML = `
            <div class="theme-preview">
                <div class="theme-color" style="background: ${theme.bg}"></div>
                <div class="theme-color" style="background: ${theme.accent}"></div>
            </div>
            <div class="theme-name">${theme.name}</div>
        `;
        
        grid.appendChild(card);
    });
}

// Render fonts
function renderFonts() {
    const grid = document.getElementById('fontsGrid');
    grid.innerHTML = '';
    
    fonts.forEach(font => {
        const card = document.createElement('div');
        card.className = `font-card ${currentUser?.font === font.id ? 'active' : ''}`;
        card.onclick = () => selectFont(font.id);
        
        card.innerHTML = `
            <div class="font-name" style="font-family: ${font.family}">${font.name}</div>
            <div class="font-preview" style="font-family: ${font.family}">Sample text 123</div>
        `;
        
        grid.appendChild(card);
    });
}

// Select theme
async function selectTheme(themeId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: themeId })
        });
        
        if (response.ok) {
            currentUser.theme = themeId;
            applyTheme(themeId);
            renderThemes();
            showToast('Тему змінено', 'success');
        }
    } catch (error) {
        showToast('Помилка зміни теми', 'error');
    }
}

// Select font
async function selectFont(fontId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ font: fontId })
        });
        
        if (response.ok) {
            currentUser.font = fontId;
            applyFont(fontId);
            renderFonts();
            showToast('Шрифт змінено', 'success');
        }
    } catch (error) {
        showToast('Помилка зміни шрифту', 'error');
    }
}

// Apply theme
function applyTheme(themeId) {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;
    
    document.documentElement.style.setProperty('--bg-primary', theme.bg);
    document.documentElement.style.setProperty('--text-primary', theme.text);
    document.documentElement.style.setProperty('--accent-blue', theme.accent);
}

// Apply font
function applyFont(fontId) {
    const font = fonts.find(f => f.id === fontId);
    if (!font) return;
    
    document.documentElement.style.setProperty('--font-family', font.family);
}

// Auth functions
function openAuthModal() {
    document.getElementById('authModal').classList.add('show');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab:nth-child(${tab === 'login' ? 1 : 2})`).classList.add('active');
    
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            updateUserUI();
            loadUserSettings();
            closeAuthModal();
            showToast('Успішний вхід', 'success');
        } else {
            showToast(data.error || 'Помилка входу', 'error');
        }
    } catch (error) {
        showToast('Помилка з\'єднання', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            updateUserUI();
            closeAuthModal();
            showToast('Реєстрація успішна', 'success');
        } else {
            showToast(data.error || 'Помилка реєстрації', 'error');
        }
    } catch (error) {
        showToast('Помилка з\'єднання', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        updateUserUI();
        showToast('Вихід виконано', 'success');
    } catch (error) {
        showToast('Помилка виходу', 'error');
    }
}

// Profile functions
function openProfile() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    document.getElementById('profileAvatar').src = currentUser.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';
    document.getElementById('profileUsername').value = currentUser.username;
    document.getElementById('profileId').value = currentUser.id;
    document.getElementById('profileEmail').value = currentUser.email || '';
    
    document.getElementById('profileModal').classList.add('show');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('show');
}

function uploadAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatar = e.target.result;
        document.getElementById('profileAvatar').src = avatar;
    };
    reader.readAsDataURL(file);
}

async function saveProfile() {
    const email = document.getElementById('profileEmail').value;
    const avatar = document.getElementById('profileAvatar').src;
    
    try {
        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, avatar })
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUserUI();
            showToast('Профіль збережено', 'success');
        } else {
            showToast('Помилка збереження', 'error');
        }
    } catch (error) {
        showToast('Помилка з\'єднання', 'error');
    }
}

// Settings functions
function openSettings() {
    if (!currentUser) {
        openAuthModal();
        return;
    }
    
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('show');
}

function switchSettingsTab(tab) {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.settings-tab:nth-child(${tab === 'personalization' ? 1 : 2})`).classList.add('active');
    
    document.getElementById('personalizationTab').style.display = tab === 'personalization' ? 'block' : 'none';
    document.getElementById('notificationsTab').style.display = tab === 'notifications' ? 'block' : 'none';
}

// User menu toggle
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById('userDropdown').classList.remove('show');
    }
});

// Load from local storage
function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            tables = data.tables || [];
            if (tables.length > 0) {
                activeTableId = tables[0].id;
            }
            renderTabs();
            renderTable();
            showToast('Завантажено з локального сховища', 'success');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Save to local storage and sync to backend
async function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ tables }));
        
        // Sync to backend for export
        await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tables: tables })
        });
        
        showToast('Збережено', 'success');
    } catch (error) {
        console.error('Error saving:', error);
        showToast('Помилка збереження', 'error');
    }
}

// Import from JSON file
function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const importedTables = data.tables || [];
            
            // Re-assign IDs and ensure rows exist
            importedTables.forEach((table, index) => {
                table.id = Date.now() + index;
                table.rows = table.rows || [];
                table.columns = table.columns || [];
            });
            
            tables = importedTables;
            
            if (tables.length > 0) {
                activeTableId = tables[0].id;
            } else {
                activeTableId = null;
            }
            
            renderTabs();
            renderTable();
            saveToLocalStorage();
            showToast('Імпортовано успішно', 'success');
        } catch (error) {
            console.error('Error importing file:', error);
            showToast('Помилка імпорту файлу: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Load tables from server
async function loadTables() {
    try {
        const response = await fetch('/api/tables');
        const data = await response.json();
        tables = data.tables || [];
        
        if (tables.length > 0) {
            activeTableId = tables[0].id;
        }
        
        renderTabs();
        renderTable();
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

// Add new table
async function addTable() {
    const newTable = {
        id: Date.now(),
        name: `table_${tables.length + 1}`,
        x: 0,
        y: 0,
        columns: [
            { name: 'id', type: 'INTEGER', primary: true, autoincrement: true, nullable: false }
        ],
        rows: []
    };
    
    tables.push(newTable);
    activeTableId = newTable.id;
    
    renderTabs();
    renderTable();
    saveToLocalStorage();
    showToast('Таблицю створено', 'success');
}

// Render tabs
function renderTabs() {
    const tabsList = document.getElementById('tabsList');
    tabsList.innerHTML = '';
    
    tables.forEach(table => {
        const tab = document.createElement('div');
        tab.className = `tab ${table.id === activeTableId ? 'active' : ''}`;
        tab.dataset.tableId = table.id;
        
        tab.innerHTML = `
            <span class="tab-name">${table.name}</span>
            <button class="tab-close" onclick="event.stopPropagation(); deleteTable(${table.id})">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        
        tab.addEventListener('click', () => switchTab(table.id));
        tabsList.appendChild(tab);
    });
}

// Switch tab
function switchTab(tableId) {
    activeTableId = tableId;
    renderTabs();
    renderTable();
}

// Render table
function renderTable() {
    const table = tables.find(t => t.id === activeTableId);
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    const tableNameInput = document.getElementById('currentTableName');
    
    if (!table) {
        thead.innerHTML = '';
        tbody.innerHTML = `
            <tr>
                <td colspan="100" class="row-number">
                    <div class="empty-state">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/>
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                        </svg>
                        <p>Натисніть "+ Нова таблиця" для створення</p>
                    </div>
                </td>
            </tr>
        `;
        tableNameInput.value = '';
        updateStatusBar(0, 0);
        return;
    }
    
    tableNameInput.value = table.name;
    
    // Render header
    const columns = table.columns || [];
    let headerHTML = '<tr>';
    
    // Row number column
    headerHTML += '<th class="row-number">#</th>';
    
    columns.forEach((col, colIndex) => {
        headerHTML += `
            <th data-column-index="${colIndex}">
                <div class="th-content">
                    <div class="th-header">
                        <input type="text" class="th-name" value="${col.name}" 
                            onchange="updateColumnName(${colIndex}, this.value)"
                            onclick="event.stopPropagation()">
                        <select class="th-type" onchange="updateColumnType(${colIndex}, this.value)">
                            ${DATA_TYPES.map(type => `<option value="${type}" ${col.type === type ? 'selected' : ''}>${type}</option>`).join('')}
                        </select>
                    </div>
                    <div class="th-options">
                        <button class="th-option ${col.primary ? 'active' : ''}" onclick="toggleColumnOption(${colIndex}, 'primary')" title="Первинний ключ">PK</button>
                        <button class="th-option ${col.nullable === false ? 'active' : ''}" onclick="toggleColumnOption(${colIndex}, 'nullable')" title="NOT NULL">NN</button>
                        <button class="th-option ${col.autoincrement ? 'active' : ''}" onclick="toggleColumnOption(${colIndex}, 'autoincrement')" title="AUTOINCREMENT">AI</button>
                    </div>
                </div>
                <button class="th-delete" onclick="deleteColumn(${colIndex})" title="Видалити стовпець">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </th>
        `;
    });
    
    headerHTML += '</tr>';
    thead.innerHTML = headerHTML;
    
    // Render body
    const rows = table.rows || [];
    let bodyHTML = '';
    
    rows.forEach((row, rowIndex) => {
        bodyHTML += '<tr>';
        
        // Row number
        bodyHTML += `
            <td class="row-number">
                <button class="row-delete" onclick="deleteRow(${rowIndex})" title="Видалити рядок">
                    ${rowIndex + 1}
                </button>
            </td>
        `;
        
        columns.forEach((col, colIndex) => {
            const value = row[col.name] || '';
            
            // Check if boolean type
            if (col.type === 'BOOLEAN') {
                const isChecked = value === true || value === 'true' || value === '1' || value === 1;
                bodyHTML += `
                    <td>
                        <label class="checkbox-cell">
                            <input type="checkbox" 
                                ${isChecked ? 'checked' : ''} 
                                onchange="updateCell(${rowIndex}, '${col.name}', this.checked)">
                            <span class="checkbox-custom"></span>
                        </label>
                    </td>
                `;
            } else {
                bodyHTML += `
                    <td>
                        <input type="text" class="cell-input" 
                            value="${value}" 
                            placeholder="${col.type}"
                            onchange="updateCell(${rowIndex}, '${col.name}', this.value)"
                            onfocus="selectCell(this, ${rowIndex}, ${colIndex})">
                    </td>
                `;
            }
        });
        
        bodyHTML += '</tr>';
    });
    
    tbody.innerHTML = bodyHTML;
    
    updateStatusBar(columns.length, rows.length);
}

// Select cell
function selectCell(input, rowIndex, colIndex) {
    document.querySelectorAll('.cell-input').forEach(el => el.classList.remove('selected'));
    input.classList.add('selected');
    selectedCell = { rowIndex, colIndex };
}

// Update table name
function updateTableName(name) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table) return;
    
    table.name = name;
    renderTabs();
    saveToLocalStorage();
}

// Update column name
function updateColumnName(colIndex, name) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.columns[colIndex]) return;
    
    const oldName = table.columns[colIndex].name;
    table.columns[colIndex].name = name;
    
    // Update row data
    table.rows.forEach(row => {
        if (row[oldName] !== undefined) {
            row[name] = row[oldName];
            delete row[oldName];
        }
    });
    
    saveToLocalStorage();
    renderTable();
}

// Update column type
function updateColumnType(colIndex, type) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.columns[colIndex]) return;
    
    table.columns[colIndex].type = type;
    saveToLocalStorage();
    renderTable();
}

// Toggle column option
function toggleColumnOption(colIndex, option) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.columns[colIndex]) return;
    
    if (option === 'nullable') {
        table.columns[colIndex].nullable = table.columns[colIndex].nullable === false ? true : false;
    } else {
        table.columns[colIndex][option] = !table.columns[colIndex][option];
    }
    
    saveToLocalStorage();
    renderTable();
}

// Add column
function addColumn() {
    const table = tables.find(t => t.id === activeTableId);
    if (!table) {
        showToast('Спочатку створіть таблицю', 'error');
        return;
    }
    
    if (!table.columns) table.columns = [];
    
    table.columns.push({
        name: `column_${table.columns.length + 1}`,
        type: 'TEXT',
        primary: false,
        nullable: true,
        autoincrement: false
    });
    
    saveToLocalStorage();
    renderTable();
    showToast('Стовпець додано', 'success');
}

// Delete column
function deleteColumn(colIndex) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.columns[colIndex]) return;
    
    const colName = table.columns[colIndex].name;
    table.columns.splice(colIndex, 1);
    
    // Remove column data from rows
    table.rows.forEach(row => {
        delete row[colName];
    });
    
    saveToLocalStorage();
    renderTable();
    showToast('Стовпець видалено', 'success');
}

// Add row
function addRow() {
    const table = tables.find(t => t.id === activeTableId);
    if (!table) {
        showToast('Спочатку створіть таблицю', 'error');
        return;
    }
    
    if (!table.rows) table.rows = [];
    
    const newRow = {};
    (table.columns || []).forEach(col => {
        newRow[col.name] = col.type === 'BOOLEAN' ? false : '';
    });
    
    table.rows.push(newRow);
    
    saveToLocalStorage();
    renderTable();
    showToast('Рядок додано', 'success');
}

// Delete row
function deleteRow(rowIndex) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.rows[rowIndex]) return;
    
    table.rows.splice(rowIndex, 1);
    
    saveToLocalStorage();
    renderTable();
    showToast('Рядок видалено', 'success');
}

// Update cell
function updateCell(rowIndex, colName, value) {
    const table = tables.find(t => t.id === activeTableId);
    if (!table || !table.rows[rowIndex]) return;
    
    table.rows[rowIndex][colName] = value;
    saveToLocalStorage();
}

// Delete table
function deleteTable(tableId) {
    if (!confirm('Видалити цю таблицю?')) return;
    
    tables = tables.filter(t => t.id !== tableId);
    
    if (activeTableId === tableId) {
        activeTableId = tables.length > 0 ? tables[0].id : null;
    }
    
    renderTabs();
    renderTable();
    saveToLocalStorage();
    showToast('Таблицю видалено', 'success');
}

// Clear all
function clearAll() {
    if (!tables.length) return;
    if (!confirm('Очистити всі таблиці? Цю дію неможливо скасувати.')) return;
    
    tables = [];
    activeTableId = null;
    localStorage.removeItem(STORAGE_KEY);
    renderTabs();
    renderTable();
    showToast('Очищено', 'success');
}

// Update status bar
function updateStatusBar(cols, rows) {
    document.getElementById('colCount').textContent = cols;
    document.getElementById('rowCount').textContent = rows;
}

// Show toast
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 2000);
}