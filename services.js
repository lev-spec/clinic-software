document.addEventListener("DOMContentLoaded", function () {
    const servicesListContainer = document.getElementById("services-list-container");
    const addServiceBtn = document.getElementById("add-service-btn");
    const serviceModal = document.getElementById("service-modal");
    const closeServiceModalBtn = document.querySelector(".close-modal");
    const serviceForm = document.getElementById("service-form");
    const searchInput = document.getElementById("search-service");

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Load Services
    renderServices();

    // --- Modal Logic ---
    if (addServiceBtn) {
        if (!isAdmin) {
            addServiceBtn.style.display = 'none';
        } else {
            addServiceBtn.addEventListener("click", () => {
                document.querySelector("#service-modal h2").textContent = "ახალი სერვისის დამატება";
                document.querySelector("#service-form .submit-btn").textContent = "შენახვა";
                document.getElementById("service-edit-id").value = "";
                serviceForm.reset();
                serviceModal.style.display = "block";
                document.body.style.overflow = "hidden";
            });
        }
    }

    if (closeServiceModalBtn) {
        closeServiceModalBtn.addEventListener("click", () => {
            serviceModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === serviceModal) {
            serviceModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // --- Form Submission ---
    if (serviceForm && isAdmin) {
        serviceForm.addEventListener("submit", function (e) {
            e.preventDefault();

            const editId = document.getElementById("service-edit-id").value;
            const newService = {
                id: editId || Date.now().toString(),
                classification: document.querySelector('input[name="serviceClassification"]:checked').value,
                name: document.getElementById("serviceName").value,
                code: document.getElementById("serviceCode").value,
                cptCode: document.getElementById("cptCode").value,
                category: document.getElementById("category").value,
                price: document.getElementById("price").value,
                insuranceCompany: document.getElementById("insuranceCompany").value,
                duration: document.getElementById("duration").value,
                serviceType: document.getElementById("serviceType").value,
                formIV100: document.getElementById("formIV100").checked,
                createdAt: new Date().toISOString()
            };

            let services = JSON.parse(localStorage.getItem("services")) || [];

            if (editId) {
                const index = services.findIndex(s => s.id === editId);
                if (index !== -1) {
                    services[index] = newService;
                    localStorage.setItem("services", JSON.stringify(services));
                    alert("სერვისი განახლდა!");
                }
            } else {
                services.push(newService);
                localStorage.setItem("services", JSON.stringify(services));
                alert("სერვისი წარმატებით დაემატა!");
            }

            serviceModal.style.display = "none";
            document.body.style.overflow = "auto";
            renderServices();
        });
    }

    // --- Search ---
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderServices(e.target.value);
        });
    }

    // --- Global Helpers ---
    window.deleteService = function(id) {
        if (!isAdmin) return;
        if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ სერვისის წაშლა?")) {
            let services = JSON.parse(localStorage.getItem("services")) || [];
            services = services.filter(s => s.id !== id);
            localStorage.setItem("services", JSON.stringify(services));
            renderServices(searchInput ? searchInput.value : "");
        }
    }

    window.openEditServiceModal = function(id) {
        if (!isAdmin) return;
        const services = JSON.parse(localStorage.getItem("services")) || [];
        const service = services.find(s => s.id === id);
        
        if (service) {
            document.querySelector("#service-modal h2").textContent = "სერვისის რედაქტირება";
            document.querySelector("#service-form .submit-btn").textContent = "განახლება";
            document.getElementById("service-edit-id").value = service.id;

            const classification = service.classification || "Visiting";
            const radio = document.querySelector(`input[name="serviceClassification"][value="${classification}"]`);
            if(radio) radio.checked = true;

            document.getElementById("serviceName").value = service.name;
            document.getElementById("serviceCode").value = service.code;
            document.getElementById("cptCode").value = service.cptCode;
            document.getElementById("category").value = service.category;
            document.getElementById("price").value = service.price;
            document.getElementById("insuranceCompany").value = service.insuranceCompany;
            document.getElementById("duration").value = service.duration;
            document.getElementById("serviceType").value = service.serviceType;
            document.getElementById("formIV100").checked = service.formIV100;

            serviceModal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    }
    
    window.showServiceDetails = function(id) {
        const services = JSON.parse(localStorage.getItem("services")) || [];
        const service = services.find(s => s.id === id);
        if(!service) return;
        
        let content = `
            <div style="line-height: 1.6;">
                <p><strong>დასახელება:</strong> ${service.name}</p>
                <p><strong>კოდი:</strong> ${service.code}</p>
                <p><strong>CPT კოდი:</strong> ${service.cptCode}</p>
                <p><strong>კატეგორია:</strong> ${service.category}</p>
                <p><strong>ფასი:</strong> ${service.price} GEL</p>
                <p><strong>დაზღვევა:</strong> ${service.insuranceCompany}</p>
                <p><strong>ხანგრძლივობა:</strong> ${service.duration} წთ</p>
                <p><strong>ტიპი:</strong> ${service.serviceType}</p>
                <p><strong>ფორმა IV-100:</strong> ${service.formIV100 ? 'კი' : 'არა'}</p>
            </div>
        `;
        
        if (window.showCustomModal) {
            window.showCustomModal("სერვისის დეტალები", content);
        } else {
            alert("დეტალები:\n" + content.replace(/<[^>]*>?/gm, ' '));
        }
    }

    function renderServices(searchTerm = "") {
        const services = JSON.parse(localStorage.getItem("services")) || [];
        servicesListContainer.innerHTML = "";

        if (services.length === 0) {
            servicesListContainer.innerHTML = '<div class="no-data">სერვისები არ მოიძებნა.</div>';
            return;
        }

        const filtered = services.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filtered.length === 0) {
            servicesListContainer.innerHTML = '<div class="no-data">შესაბამისი სერვისები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(s => {
            const card = document.createElement("div");
            card.className = "patient-card"; // Reuse patient card style
            
            let buttonsHtml = '';
            if (isAdmin) {
                buttonsHtml = `
                    <button class="details-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">დეტალები</button>
                    <button class="edit-btn" style="flex: 1; background-color: #ff9800; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">რედაქტირება</button>
                    <button class="delete-btn" style="flex: 1; background-color: #f44336; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">წაშლა</button>
                `;
            } else {
                buttonsHtml = `
                    <button class="details-btn" style="flex: 1; background-color: #2196f3; color: white; border: none; padding: 8px; border-radius: 4px; cursor: pointer;">დეტალები</button>
                `;
            }

            const isLab = s.classification === "Laboratory";
            const iconClass = isLab ? "fa-flask" : "fa-file-medical";
            const iconBg = isLab ? "#e8f5e9" : "#e0f2f1"; 
            const iconColor = isLab ? "#2e7d32" : "#00695c";
            const typeLabel = isLab ? '<span style="font-size: 0.75em; color: #2e7d32; display: block;">ლაბორატორია</span>' : '<span style="font-size: 0.75em; color: #00695c; display: block;">სავიზიტო</span>';

            card.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar" style="background-color: ${iconBg}; color: ${iconColor};">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="patient-info-main">
                        <h3>${s.name}</h3>
                        <span class="patient-id">Code: ${s.code}</span>
                        ${typeLabel}
                    </div>
                    <div class="patient-status" style="background-color: #009688;">${s.price} GEL</div>
                </div>
                <div class="patient-body">
                    <p><strong>კატეგორია:</strong> ${s.category || "-"}</p>
                    <p><strong>ტიპი:</strong> ${s.serviceType || "-"}</p>
                </div>
                <div class="patient-footer" style="display: flex; gap: 10px;">
                    ${buttonsHtml}
                </div>
            `;
            
            // Attach Event Listeners
            const detailsBtn = card.querySelector(".details-btn");
            if(detailsBtn) detailsBtn.addEventListener("click", () => showServiceDetails(s.id));

            if (isAdmin) {
                const editBtn = card.querySelector(".edit-btn");
                if(editBtn) editBtn.addEventListener("click", () => openEditServiceModal(s.id));

                const deleteBtn = card.querySelector(".delete-btn");
                if(deleteBtn) deleteBtn.addEventListener("click", () => deleteService(s.id));
            }

            servicesListContainer.appendChild(card);
        });
    }
});
