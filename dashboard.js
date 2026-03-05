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
        // Inject User Info into Sidebar
        const navContainer = document.querySelector(".bottom_left_container");
        if (navContainer) {
            const userInfoDiv = document.createElement("div");
            userInfoDiv.id = "user-info-panel";
            userInfoDiv.style.marginTop = "auto";
            userInfoDiv.style.padding = "15px";
            userInfoDiv.style.color = "white";
            userInfoDiv.style.textAlign = "center";
            userInfoDiv.style.borderTop = "1px solid rgba(255,255,255,0.1)";
            userInfoDiv.style.background = "rgba(0,0,0,0.2)";
            
            if (currentUser.username === 'admin1234') {
                userInfoDiv.innerHTML = `
                    <div style="font-weight: bold; font-size: 1.2em;">ადმინისტრაცია</div>
                `;
            } else {
                userInfoDiv.innerHTML = `
                    <div style="font-weight: bold; margin-bottom: 5px; font-size: 1.1em;">${currentUser.firstName} ${currentUser.lastName}</div>
                    <div style="font-size: 0.9em; opacity: 0.9; color: #bbdefb;">@${currentUser.username}</div>
                    <div style="font-size: 0.8em; opacity: 0.6; margin-top: 5px; text-transform: uppercase; letter-spacing: 1px;">${currentUser.role === 'admin' ? 'ადმინისტრატორი' : 'ექიმი'}</div>
                `;
            }
            navContainer.appendChild(userInfoDiv);
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
