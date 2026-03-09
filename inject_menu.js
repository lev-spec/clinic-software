const fs = require('fs');
const glob = require('glob');

const jsPath = '/opt/build/repo/dashboard.js';
let jsContent = fs.readFileSync(jsPath, 'utf8');

// We need to inject the menu generation logic into dashboard.js
const menuLogic = `
        // Generate Sidebar Menu based on Roles
        const navContainer = document.querySelector(".bottom_left_container");
        if (navContainer) {
            let ul = navContainer.querySelector("ul");
            if (!ul) {
                ul = document.createElement("ul");
                ul.id = "sidebar-menu";
                // Insert before user info
                navContainer.insertBefore(ul, navContainer.firstChild);
            } else {
                ul.id = "sidebar-menu";
                ul.innerHTML = ""; // Clear existing static menu
            }

            const userOriginalRoles = currentUser.originalRoles ? currentUser.originalRoles.split(',').map(r=>r.trim()) : [];
            if (currentUser.role === 'admin' && userOriginalRoles.length === 0) {
                userOriginalRoles.push('ადმინისტრატორი'); // Fallback for hardcoded admin
            }

            const isMedical = userOriginalRoles.some(r => ["ექიმი", "ექთანი", "ლაბორანტი", "რენტგენოლოგი", "ექოსკოპისტი", "პარამედიკოსი", "ფარმაცევტი", "ფიზიოთერაპევტი", "ანესთეზიოლოგი"].includes(r));
            const isAdmin = userOriginalRoles.some(r => ["ადმინისტრატორი"].includes(r));
            const isAccountant = userOriginalRoles.some(r => ["ბუღალტერი"].includes(r));
            const isReceptionist = userOriginalRoles.some(r => ["რეგისტრატორი"].includes(r));
            const isLabTech = userOriginalRoles.some(r => ["ლაბორანტი"].includes(r));
            const isPharmacist = userOriginalRoles.some(r => ["ფარმაცევტი"].includes(r));

            const menuItemsDef = [
                { title: "🏠 მთავარი", href: "dashboard.html", show: true },
                { title: "👤 პაციენტების სია", href: "patients.html", show: true },
                { title: "📅 კალენდარი", href: "calendar.html", show: true },
                { title: "📝 EMR (ისტორია)", href: "emr.html", show: isMedical },
                { title: "📃 თანამშრომლები", href: "doctros.html", show: isAdmin },
                { title: "📄 სერვისები", href: "services.html", show: isAdmin },
                { title: "🧪 ლაბორატორია", href: "laboratory.html", show: isMedical },
                { title: "📦 საწყობი", href: "inventory.html", show: isPharmacist || isLabTech || isAdmin },
                { title: "💰 ბილინგი", href: "billing.html", show: isReceptionist || isAccountant },
                { title: "📊 რეპორტები", href: "reports.html", show: isAdmin || isAccountant },
                { title: "💬 კომუნიკაცია", href: "messages.html", show: true },
                { title: "⚙️ პარამეტრები", href: "settings.html", show: true },
                { title: "🚪 გამოსვლა", href: "exit.html", show: true }
            ];

            menuItemsDef.forEach(item => {
                if (item.show) {
                    const li = document.createElement("li");
                    li.className = "menu-item";
                    li.innerHTML = `<a href="\${item.href}">\${item.title}</a>`;
                    ul.appendChild(li);
                }
            });
        }
`;

// Now let's find a good place to inject this. After injecting User Info into Sidebar:
const injectionPoint = 'navContainer.appendChild(userInfoDiv);
        }';
if (jsContent.includes(injectionPoint)) {
    jsContent = jsContent.replace(injectionPoint, injectionPoint + '
' + menuLogic);
    fs.writeFileSync(jsPath, jsContent);
    console.log('Successfully injected menu logic into dashboard.js');
} else {
    console.log('Injection point not found in dashboard.js');
}
