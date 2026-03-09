const fs = require('fs');
let content = fs.readFileSync('/opt/build/repo/laboratory.js', 'utf8');

// 1. Add auth logic
const authLogic = `
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const userRoles = user && user.originalRoles ? user.originalRoles.split(',').map(r => r.trim()) : [];
    const isLabTech = userRoles.includes("ლაბორანტი") || (user && user.role === 'admin');

    if (!isLabTech && addLabBtn) {
        addLabBtn.style.display = 'none';
    }
`;
content = content.replace('    // --- Initialization ---', authLogic + '\n    // --- Initialization ---');

// 2. Modify actionButtons logic
const oldBtnLogic = `            let actionButtons = '';
            if (o.status !== "Completed") {
                actionButtons += \`<button class="result-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">პასუხის შეყვანა</button>\`;
            } else {
                actionButtons += \`<button class="print-btn" style="flex: 1; background-color: #607d8b; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">🖨️ ბეჭდვა</button>\`;
            }
            
            // Delete button (Admin only? Or safe to add for all for now)
            actionButtons += \`<button class="delete-btn" style="flex: 0 0 auto; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>\`;`;

const newBtnLogic = `            let actionButtons = '';
            if (o.status !== "Completed") {
                if (isLabTech) {
                    actionButtons += \`<button class="result-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">პასუხის შეყვანა</button>\`;
                }
            } else {
                actionButtons += \`<button class="print-btn" style="flex: 1; background-color: #607d8b; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">🖨️ ბეჭდვა</button>\`;
            }
            
            if (isLabTech) {
                actionButtons += \`<button class="delete-btn" style="flex: 0 0 auto; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>\`;
            }`;

content = content.replace(oldBtnLogic, newBtnLogic);
fs.writeFileSync('/opt/build/repo/laboratory.js', content);
