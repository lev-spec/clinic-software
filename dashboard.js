document.addEventListener("DOMContentLoaded", function () {
    // --- USER SESSION & ROLE MANAGEMENT ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    // Redirect to login if not authenticated and not on login page
    const path = window.location.pathname;
    const isLoginPage = path.endsWith("index.html") || path === "/" || path.endsWith("/");
    
    if (!currentUser && !isLoginPage) {
         window.location.href = "index.html";
         return;
    }

    if (currentUser && !isLoginPage) {
        // Inject User Info bar at top of main content area (inline, not floating)
        const mainContent = document.querySelector(".main_content");
        if (mainContent) {
            const userInfoBar = document.createElement("div");
            userInfoBar.id = "user-info-bar";
            userInfoBar.className = "user-info-bar";

            const userInfoBadge = document.createElement("div");
            userInfoBadge.className = "user-info-badge";

            if (currentUser.username === 'admin1234') {
                userInfoBadge.innerHTML = `<i class="fa-solid fa-shield-halved" style="color: #1a73e8;"></i> <strong>ადმინისტრაცია</strong>`;
            } else {
                userInfoBadge.innerHTML = `
                    <div class="user-avatar">
                        ${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}
                    </div>
                    <span class="user-name">${currentUser.firstName} ${currentUser.lastName}</span>
                    <span class="user-role-separator">|</span>
                    <span class="user-role">${currentUser.originalRoles || (currentUser.role === 'admin' ? 'ადმინისტრატორი' : 'ექიმი')}</span>
                `;
            }

            // Inject User Info badge integrated with page headers to avoid pushing content down
            const h2 = mainContent.querySelector('h2');
            let parent = h2 ? h2.parentElement : null;
            let inserted = false;

            if (parent && parent !== mainContent && (parent.classList.contains('patients-header') || parent.classList.contains('calendar-header') || parent.style.display.includes('flex') || window.getComputedStyle(parent).display.includes('flex'))) {
                let actionsDiv = parent.querySelector('.actions, .calendar-controls');
                if (actionsDiv) {
                    actionsDiv.style.display = 'flex';
                    actionsDiv.style.alignItems = 'center';
                    actionsDiv.style.gap = '15px';
                    actionsDiv.appendChild(userInfoBadge);
                } else {
                    let siblings = Array.from(parent.children).filter(c => c !== h2 && c.tagName !== 'SCRIPT');
                    if (siblings.length > 0) {
                        let rightContainer = document.createElement('div');
                        rightContainer.style.display = 'flex';
                        rightContainer.style.alignItems = 'center';
                        rightContainer.style.gap = '15px';
                        parent.appendChild(rightContainer);
                        siblings.forEach(s => rightContainer.appendChild(s));
                        rightContainer.appendChild(userInfoBadge);
                    } else {
                        parent.appendChild(userInfoBadge);
                    }
                }
                inserted = true;
            } else if (h2) {
                userInfoBar.style.display = 'flex';
                userInfoBar.style.justifyContent = 'space-between';
                userInfoBar.style.alignItems = 'center';
                userInfoBar.style.marginBottom = '20px';
                userInfoBar.style.flexWrap = 'wrap';
                userInfoBar.style.gap = '15px';
                
                h2.parentNode.insertBefore(userInfoBar, h2);
                userInfoBar.appendChild(h2);
                h2.style.margin = '0';
                userInfoBar.appendChild(userInfoBadge);
                inserted = true;
            }

            if (!inserted) {
                userInfoBar.appendChild(userInfoBadge);
                mainContent.insertBefore(userInfoBar, mainContent.firstChild);
            }
        }

        // --- Generate Sidebar Menu based on Roles ---
        const navContainer = document.querySelector(".bottom_left_container");
        if (navContainer) {
            let ul = navContainer.querySelector("ul");
            if (!ul) {
                ul = document.createElement("ul");
                ul.id = "sidebar-menu";
                navContainer.appendChild(ul);
            } else {
                ul.id = "sidebar-menu";
                ul.innerHTML = ""; // Clear existing static menu
            }

            const userOriginalRoles = currentUser.originalRoles ? currentUser.originalRoles.split(',').map(r => r.trim()) : [];
            if (currentUser.role === 'admin' && userOriginalRoles.length === 0) {
                userOriginalRoles.push('ადმინისტრატორი'); // Fallback
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
                { title: "📝 EMR", href: "emr.html", show: isMedical || isAdmin },
                { title: "📃 თანამშრომლები", href: "doctros.html", show: isAdmin },
                { title: "📄 სერვისები", href: "services.html", show: isAdmin },
                { title: "🧪 ლაბორატორია", href: "laboratory.html", show: isMedical || isAdmin },
                { title: "💊 აფთიაქი/რეცეპტები", href: "pharmacy.html", show: isMedical || isPharmacist || isAdmin },
                { title: "📦 საწყობი", href: "inventory.html", show: isPharmacist || isLabTech || isAdmin },
                { title: "💰 ბილინგი", href: "billing.html", show: isReceptionist || isAccountant || isAdmin },
                { title: "📊 რეპორტები", href: "reports.html", show: isAdmin || isAccountant },
                { title: "💬 კომუნიკაცია", href: "messages.html", show: true },
                { title: "⚙️ პარამეტრები", href: "settings.html", show: true },
                { title: "🚪 გამოსვლა", href: "exit.html", show: true }
            ];

            menuItemsDef.forEach(item => {
                if (item.show) {
                    const li = document.createElement("li");
                    li.className = "menu-item";
                    const a = document.createElement("a");
                    a.href = item.href;
                    
                    if (item.title === "💬 კომუნიკაცია") {
                        const iconSpan = document.createElement("span");
                        iconSpan.style.position = "relative";
                        iconSpan.style.display = "inline-block";
                        iconSpan.innerHTML = "💬";
                        
                        // Check for unread messages
                        const allMessages = JSON.parse(localStorage.getItem("messages")) || [];
                        const hasUnread = allMessages.some(m => m.toId === currentUser.id && !m.read);
                        
                        if (hasUnread) {
                            const redDot = document.createElement("span");
                            redDot.style.position = "absolute";
                            redDot.style.top = "-2px";
                            redDot.style.right = "-2px";
                            redDot.style.width = "8px";
                            redDot.style.height = "8px";
                            redDot.style.backgroundColor = "red";
                            redDot.style.borderRadius = "50%";
                            iconSpan.appendChild(redDot);
                        }
                        
                        a.appendChild(iconSpan);
                        a.appendChild(document.createTextNode(" კომუნიკაცია"));
                    } else {
                        a.textContent = item.title;
                    }
                    
                    li.appendChild(a);
                    ul.appendChild(li);
                }
            });
        }

        // --- Global Page Access Control ---
        const currentPagePath = window.location.pathname.split("/").pop();
        
        if (currentPagePath === 'reports.html' && !isAdmin && !isAccountant) {
            window.location.href = 'dashboard.html';
        }
        if ((currentPagePath === 'doctros.html' || currentPagePath === 'services.html') && !isAdmin) {
            window.location.href = 'dashboard.html';
        }
        if (currentPagePath === 'emr.html' && !isMedical && !isAdmin) {
            window.location.href = 'dashboard.html';
        }
        if (currentPagePath === 'laboratory.html' && !isMedical && !isAdmin) {
            window.location.href = 'dashboard.html';
        }
        if (currentPagePath === 'pharmacy.html' && !isMedical && !isPharmacist && !isAdmin) {
            window.location.href = 'dashboard.html';
        }
        if (currentPagePath === 'inventory.html' && !isPharmacist && !isLabTech && !isAdmin) {
            window.location.href = 'dashboard.html';
        }
        if (currentPagePath === 'billing.html' && !isReceptionist && !isAccountant && !isAdmin) {
            window.location.href = 'dashboard.html';
        }

        // Apply Global Permissions
        if (currentUser.role === 'doctor') {
            document.body.classList.add('role-doctor');
            
            // Hide elements explicitly marked for admins only
            const adminOnlyElements = document.querySelectorAll('.admin-only');
            adminOnlyElements.forEach(el => el.style.display = 'none');
            
            // Specific Logic for specific pages
            if (path.includes('doctros.html')) {
                const addBtn = document.getElementById('add-doctor-btn');
                if (addBtn) addBtn.style.display = 'none';
            }
            if (path.includes('services.html')) {
                const addBtn = document.getElementById('add-service-btn');
                if (addBtn) addBtn.style.display = 'none';
            }
            if (path.includes('settings.html')) {
                // Settings logic handled in settings.js mostly, but global CSS helper:
                const clinicNameInput = document.getElementById('clinic-name');
                if(clinicNameInput) clinicNameInput.disabled = true;
            }
        }
    }

    // Sidebar toggle logic
    const toggleBtn = document.createElement("button");
    toggleBtn.innerHTML = "☰";
    toggleBtn.className = "sidebar-toggle";
    document.body.appendChild(toggleBtn);

    const sidebar = document.querySelector(".left_main_container");
    const overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    toggleBtn.addEventListener("click", function () {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("active");
    });

    overlay.addEventListener("click", function () {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
    });

    // Active menu highlighting
    const menuItems = document.querySelectorAll(".menu-item a");
    const currentPage = window.location.pathname.split("/").pop();

    menuItems.forEach(link => {
        const linkPage = link.getAttribute("href");
        if (linkPage && (linkPage === currentPage || (currentPage === "" && linkPage === "index.html"))) {
            link.parentElement.classList.add("active");
        } else {
            link.parentElement.classList.remove("active");
        }
    });

    // --- REAL DATA CALCULATION ---
    const patients = JSON.parse(localStorage.getItem("patients")) || [];
    const appointments = JSON.parse(localStorage.getItem("appointments")) || [];
    const services = JSON.parse(localStorage.getItem("services")) || [];
    
    // 1. Total Patients
    const totalPatients = patients.length;
    const patientCountElement = document.getElementById("total-patients-count") || document.querySelector(".dashboard-card.patients .poi");
    if (patientCountElement) patientCountElement.innerText = totalPatients;

    // 1.5 Total Staff (Doctors)
    const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
    const staffCountElement = document.getElementById("available-staff-count");
    if (staffCountElement) staffCountElement.innerText = doctors.length;

    // 2. Total Appointments (Visits)
    const appointmentsCount = appointments.length;
    const appointmentsEl = document.getElementById("appointments-count");
    if (appointmentsEl) appointmentsEl.innerText = appointmentsCount;

    // 3. Today's Patients
    const today = new Date().toISOString().split('T')[0];
    const todayPatients = appointments.filter(a => a.date === today);
    const todayPatientsCount = todayPatients.length;
    const todayPatientsEl = document.getElementById("today-patients-count");
    if (todayPatientsEl) todayPatientsEl.innerText = todayPatientsCount;

    // 4. Laboratory Tests
    const serviceCategoryMap = {};
    services.forEach(s => {
        serviceCategoryMap[s.id] = s.category;
    });

    let labTestsCount = 0;
    appointments.forEach(a => {
        const cat = serviceCategoryMap[a.serviceId];
        if (cat && (cat.includes("Lab") || cat.includes("ლაბორატორია") || cat.includes("ანალიზი"))) {
            labTestsCount++;
        }
    });
    const labTestsEl = document.getElementById("lab-tests-count");
    if (labTestsEl) labTestsEl.innerText = labTestsCount;


    // --- Render Recent Patients Table ---
    const tableBody = document.getElementById("dashboard-patients-table-body");
    if (tableBody) {
        tableBody.innerHTML = "";
        const recentPatients = patients.slice().reverse().slice(0, 5);
        
        recentPatients.forEach(p => {
            const tr = document.createElement("tr");
            tr.style.cursor = "pointer";
            tr.onclick = function() {
                window.location.href = `patients.html?personalId=${p.personalId}`;
            };

            let statusClass = "confirmed"; 
            let statusText = "აქტიური"; 
            
            if (p.status === "Inactive") {
                statusClass = "pending"; 
                statusText = "არააქტიური";
            }
            if (p.status === "Deceased") {
                statusClass = "cancelled";
                statusText = "გარდაცვლილი";
            }

            tr.innerHTML = `
                <td>${p.firstName} ${p.lastName}</td>
                <td>${p.personalId}</td>
                <td>${p.phone}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // --- CHARTS ---
    const patientsChartCanvas = document.getElementById('patientsChart');
    if (patientsChartCanvas) {
        const ctxPatients = patientsChartCanvas.getContext('2d');
        const monthCounts = {};
        const months = ["იან", "თებ", "მარ", "აპრ", "მაი", "ივნ", "ივლისი", "აგვ", "სექ", "ოქტ", "ნოემ", "დეკ"];
        const currentYear = new Date().getFullYear();
        for(let i=0; i<12; i++) monthCounts[i] = 0;

        appointments.forEach(a => {
            const d = new Date(a.date);
            if(d.getFullYear() === currentYear) monthCounts[d.getMonth()]++;
        });

        new Chart(ctxPatients, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'ვიზიტები თვეების მიხედვით',
                    data: Object.values(monthCounts),
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
    }

    const departmentsChartCanvas = document.getElementById('departmentsChart');
    if (departmentsChartCanvas) {
        const specialtyCounts = {};
        appointments.forEach(a => {
            let specialty = "General";
            if (a.doctor && a.doctor.includes("(") && a.doctor.includes(")")) {
                const matches = a.doctor.match(/\((.*?)\)/);
                if (matches && matches[1]) specialty = matches[1];
            }
            if (!specialtyCounts[specialty]) specialtyCounts[specialty] = 0;
            specialtyCounts[specialty]++;
        });

        const labels = Object.keys(specialtyCounts);
        const data = Object.values(specialtyCounts);
        if (labels.length === 0) { labels.push("მონაცემები არაა"); data.push(1); }

        const ctxDepartments = departmentsChartCanvas.getContext('2d');
        new Chart(ctxDepartments, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#f44336', '#2196f3', '#ff9800', '#9c27b0', '#4caf50', '#607d8b'],
                    hoverOffset: 4
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    // Generic Modal Helper
    window.showCustomModal = function(title, contentHTML) {
        let modal = document.getElementById('custom-info-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-info-modal';
            modal.className = 'modal';
            modal.style.display = 'none';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 500px;">
                    <span class="close-custom-modal" style="float: right; font-size: 28px; cursor: pointer;">&times;</span>
                    <h2 id="custom-modal-title"></h2>
                    <div id="custom-modal-body"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.querySelector('.close-custom-modal').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            window.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
        
        document.getElementById('custom-modal-title').innerText = title;
        document.getElementById('custom-modal-body').innerHTML = contentHTML;
        modal.style.display = 'block';
    }
});
