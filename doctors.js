document.addEventListener("DOMContentLoaded", function () {
    const doctorsListContainer = document.getElementById("doctors-list-container");
    const addDoctorBtn = document.getElementById("add-doctor-btn");
    const doctorModal = document.getElementById("doctor-modal");
    const closeDoctorModalBtn = document.querySelector(".close-modal");
    const doctorForm = document.getElementById("doctor-form");
    const searchInput = document.getElementById("search-doctor");

    // --- Role Check ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Seed Data if needed
    seedDoctors();
    renderDoctors();

    // === ROLE & SPECIALTY DATA ===
    const roleGroups = [
        {
            label: "🏥 სამედიცინო როლები",
            options: ["ექიმი", "ექთანი", "ლაბორანტი", "რენტგენოლოგი", "ექოსკოპისტი", "პარამედიკოსი", "ფარმაცევტი", "ფიზიოთერაპევტი", "ანესთეზიოლოგი"]
        },
        {
            label: "🧾 ადმინისტრაციული როლები",
            options: ["ადმინისტრატორი", "რეგისტრატორი", "ბუღალტერი"]
        },
        {
            label: "🔧 ტექნიკური / დამხმარე",
            options: ["დიასახლისი", "დაცვა", "აიტი", "ტექნიკური პერსონალი"]
        }
    ];

    const specialtyGroups = [
        {
            label: "🩺 ზოგადი მედიცინა",
            options: ["ოჯახის ექიმი", "თერაპევტი", "პედიატრი", "გერიატრი (ხანდაზმულთა ექიმი)", "გადაუდებელი მედიცინის ექიმი"]
        },
        {
            label: "❤️ შინაგანი ორგანოების სპეციალისტები",
            options: ["კარდიოლოგი", "პულმონოლოგი", "გასტროენტეროლოგი", "ნეფროლოგი", "ენდოკრინოლოგი", "რევმატოლოგი", "ჰემატოლოგი", "იმუნოლოგი"]
        },
        {
            label: "🧠 ნერვული სისტემა",
            options: ["ნევროლოგი", "ნეიროქირურგი", "ფსიქიატრი", "ფსიქოლოგი"]
        },
        {
            label: "🦴 ქირურგიული მიმართულება",
            options: ["ზოგადი ქირურგი", "ორთოპედი", "ტრავმატოლოგი", "პლასტიკური ქირურგი", "გულ–სისხლძარღვთა ქირურგი", "ნეიროქირურგი", "ონკოლოგიური ქირურგი"]
        },
        {
            label: "👁️ სპეციალიზებული ექიმები",
            options: ["ოფთალმოლოგი (თვალის ექიმი)", "ოტოლარინგოლოგი (ყელი, ყური, ცხვირი)", "დერმატოლოგი (კანის ექიმი)", "ალერგოლოგი", "ინფექციონისტი", "ვენეროლოგი"]
        },
        {
            label: "👩‍⚕️ ქალისა და მამაკაცის ჯანმრთელობა",
            options: ["გინეკოლოგი", "რეპროდუქტოლოგი", "უროლოგი", "ანდროლოგი"]
        },
        {
            label: "🧪 დიაგნოსტიკა და ლაბორატორია",
            options: ["რენტგენოლოგი", "რადიოლოგი", "ლაბორატორიის ექიმი", "პათოლოგი", "ულტრაბგერითი დიაგნოსტიკის სპეციალისტი (ექოსკოპისტი)"]
        },
        {
            label: "💊 სხვა სპეციალობები",
            options: ["ონკოლოგი", "ფიზიოთერაპევტი", "რეაბილიტოლოგი", "ანესთეზიოლოგი", "ტოქსიკოლოგი", "ეპიდემიოლოგი", "სპორტული მედიცინის ექიმი", "დიეტოლოგი"]
        }
    ];

    const nonMedicalRoles = [
        "ადმინისტრატორი", "რეგისტრატორი", "ბუღალტერი",
        "დიასახლისი", "დაცვა", "აიტი", "ტექნიკური პერსონალი"
    ];

    // === CUSTOM TAG DROPDOWN COMPONENT ===
    let selectedRoles = [];
    let selectedSpecialties = [];

    const roleTagsContainer = document.getElementById("role-tags");
    const roleTrigger = document.getElementById("role-trigger");
    const roleMenu = document.getElementById("role-menu");
    const roleOptionsContainer = document.getElementById("role-options");
    const roleSearch = document.getElementById("role-search");

    const specialtyTagsContainer = document.getElementById("specialty-tags");
    const specialtyTrigger = document.getElementById("specialty-trigger");
    const specialtyMenu = document.getElementById("specialty-menu");
    const specialtyOptionsContainer = document.getElementById("specialty-options");
    const specialtySearch = document.getElementById("specialty-search");
    const specialtyGroup = document.getElementById("specialty-group");

    // Build dropdown options from data
    function buildDropdownOptions(container, groups) {
        container.innerHTML = '';
        groups.forEach(group => {
            const groupLabel = document.createElement('div');
            groupLabel.className = 'dropdown-group-label';
            groupLabel.textContent = group.label;
            container.appendChild(groupLabel);

            group.options.forEach(opt => {
                const optEl = document.createElement('div');
                optEl.className = 'dropdown-option';
                optEl.dataset.value = opt;
                optEl.textContent = opt;
                container.appendChild(optEl);
            });
        });
    }

    if (roleOptionsContainer) buildDropdownOptions(roleOptionsContainer, roleGroups);
    if (specialtyOptionsContainer) buildDropdownOptions(specialtyOptionsContainer, specialtyGroups);

    // Render tags
    function renderTags(container, selectedArr, onRemove) {
        container.innerHTML = '';
        selectedArr.forEach(val => {
            const chip = document.createElement('span');
            chip.className = 'tag-chip';
            chip.innerHTML = `${val}<button type="button" class="tag-remove" title="წაშლა">&times;</button>`;
            chip.querySelector('.tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                onRemove(val);
            });
            container.appendChild(chip);
        });
    }

    // Update option highlights
    function updateOptionHighlights(container, selectedArr) {
        container.querySelectorAll('.dropdown-option').forEach(opt => {
            if (selectedArr.includes(opt.dataset.value)) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }

    // Toggle specialty visibility based on selected roles
    function toggleSpecialty() {
        if (!specialtyGroup) return;
        if (selectedRoles.length === 0) {
            specialtyGroup.style.display = '';
            return;
        }
        const requiresSpecialty = selectedRoles.some(role => !nonMedicalRoles.includes(role));
        if (!requiresSpecialty) {
            specialtyGroup.style.display = 'none';
            selectedSpecialties = [];
            if (specialtyTagsContainer) renderTags(specialtyTagsContainer, selectedSpecialties, removeSpecialty);
            if (specialtyOptionsContainer) updateOptionHighlights(specialtyOptionsContainer, selectedSpecialties);
        } else {
            specialtyGroup.style.display = '';
        }
    }

    // Role selection handlers
    function addRole(val) {
        if (!selectedRoles.includes(val)) {
            selectedRoles.push(val);
            renderTags(roleTagsContainer, selectedRoles, removeRole);
            updateOptionHighlights(roleOptionsContainer, selectedRoles);
            toggleSpecialty();
        }
    }

    function removeRole(val) {
        selectedRoles = selectedRoles.filter(r => r !== val);
        renderTags(roleTagsContainer, selectedRoles, removeRole);
        updateOptionHighlights(roleOptionsContainer, selectedRoles);
        toggleSpecialty();
    }

    // Specialty selection handlers
    function addSpecialty(val) {
        if (!selectedSpecialties.includes(val)) {
            selectedSpecialties.push(val);
            renderTags(specialtyTagsContainer, selectedSpecialties, removeSpecialty);
            updateOptionHighlights(specialtyOptionsContainer, selectedSpecialties);
        }
    }

    function removeSpecialty(val) {
        selectedSpecialties = selectedSpecialties.filter(s => s !== val);
        renderTags(specialtyTagsContainer, selectedSpecialties, removeSpecialty);
        updateOptionHighlights(specialtyOptionsContainer, selectedSpecialties);
    }

    // Dropdown open/close
    function openDropdown(trigger, menu) {
        closeAllDropdowns();
        trigger.classList.add('active');
        menu.classList.add('open');
        const searchInput = menu.querySelector('.dropdown-search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            // Reset filter
            menu.querySelectorAll('.dropdown-option, .dropdown-group-label').forEach(el => el.classList.remove('hidden'));
        }
    }

    function closeDropdown(trigger, menu) {
        trigger.classList.remove('active');
        menu.classList.remove('open');
    }

    function closeAllDropdowns() {
        if (roleTrigger && roleMenu) closeDropdown(roleTrigger, roleMenu);
        if (specialtyTrigger && specialtyMenu) closeDropdown(specialtyTrigger, specialtyMenu);
    }

    // Role trigger
    if (roleTrigger) {
        roleTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (roleMenu.classList.contains('open')) {
                closeDropdown(roleTrigger, roleMenu);
            } else {
                openDropdown(roleTrigger, roleMenu);
            }
        });
    }

    // Specialty trigger
    if (specialtyTrigger) {
        specialtyTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            if (specialtyMenu.classList.contains('open')) {
                closeDropdown(specialtyTrigger, specialtyMenu);
            } else {
                openDropdown(specialtyTrigger, specialtyMenu);
            }
        });
    }

    // Option click handlers
    if (roleOptionsContainer) {
        roleOptionsContainer.addEventListener('click', (e) => {
            const opt = e.target.closest('.dropdown-option');
            if (!opt) return;
            e.stopPropagation();
            const val = opt.dataset.value;
            if (selectedRoles.includes(val)) {
                removeRole(val);
            } else {
                addRole(val);
            }
        });
    }

    if (specialtyOptionsContainer) {
        specialtyOptionsContainer.addEventListener('click', (e) => {
            const opt = e.target.closest('.dropdown-option');
            if (!opt) return;
            e.stopPropagation();
            const val = opt.dataset.value;
            if (selectedSpecialties.includes(val)) {
                removeSpecialty(val);
            } else {
                addSpecialty(val);
            }
        });
    }

    // Search filter
    function filterOptions(searchEl, optionsContainer) {
        if (!searchEl || !optionsContainer) return;
        searchEl.addEventListener('input', () => {
            const term = searchEl.value.toLowerCase();
            let lastGroupLabel = null;
            let groupHasVisible = false;

            const elements = optionsContainer.children;
            // First pass: show/hide options
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                if (el.classList.contains('dropdown-group-label')) {
                    // Process previous group
                    if (lastGroupLabel && !groupHasVisible) {
                        lastGroupLabel.classList.add('hidden');
                    }
                    lastGroupLabel = el;
                    groupHasVisible = false;
                    el.classList.remove('hidden');
                } else if (el.classList.contains('dropdown-option')) {
                    if (el.textContent.toLowerCase().includes(term)) {
                        el.classList.remove('hidden');
                        groupHasVisible = true;
                    } else {
                        el.classList.add('hidden');
                    }
                }
            }
            // Handle last group
            if (lastGroupLabel && !groupHasVisible) {
                lastGroupLabel.classList.add('hidden');
            }
        });

        // Prevent dropdown close on search click
        searchEl.addEventListener('click', (e) => e.stopPropagation());
    }

    filterOptions(roleSearch, roleOptionsContainer);
    filterOptions(specialtySearch, specialtyOptionsContainer);

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (roleMenu && !roleMenu.contains(e.target) && !roleTrigger.contains(e.target)) {
            closeDropdown(roleTrigger, roleMenu);
        }
        if (specialtyMenu && !specialtyMenu.contains(e.target) && !specialtyTrigger.contains(e.target)) {
            closeDropdown(specialtyTrigger, specialtyMenu);
        }
    });

    // Prevent menu clicks from closing the menu
    if (roleMenu) roleMenu.addEventListener('click', (e) => e.stopPropagation());
    if (specialtyMenu) specialtyMenu.addEventListener('click', (e) => e.stopPropagation());

    // === SIGNATURE CANVAS LOGIC ===
    const canvas = document.getElementById("signature-pad");
    const clearBtn = document.getElementById("clear-signature");
    let ctx = null;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    if (canvas) {
        ctx = canvas.getContext("2d");

        function draw(e) {
            if (!isDrawing) return;
            const rect = canvas.getBoundingClientRect();
            let x, y;
            if (e.type.includes('touch')) {
                x = e.touches[0].clientX - rect.left;
                y = e.touches[0].clientY - rect.top;
            } else {
                x = e.clientX - rect.left;
                y = e.clientY - rect.top;
            }
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.stroke();
            [lastX, lastY] = [x, y];
        }

        canvas.addEventListener("mousedown", (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.clientX - rect.left;
            lastY = e.clientY - rect.top;
        });
        canvas.addEventListener("mousemove", draw);
        canvas.addEventListener("mouseup", () => isDrawing = false);
        canvas.addEventListener("mouseout", () => isDrawing = false);

        canvas.addEventListener("touchstart", (e) => {
            isDrawing = true;
            const rect = canvas.getBoundingClientRect();
            lastX = e.touches[0].clientX - rect.left;
            lastY = e.touches[0].clientY - rect.top;
            e.preventDefault();
        });
        canvas.addEventListener("touchmove", (e) => {
            draw(e);
            e.preventDefault();
        });
        canvas.addEventListener("touchend", () => isDrawing = false);

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            });
        }
    }

    function loadSignature(dataUrl) {
        if (!ctx || !dataUrl) {
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = dataUrl;
    }

    // === HELPER: Reset selections ===
    function resetSelections() {
        selectedRoles = [];
        selectedSpecialties = [];
        if (roleTagsContainer) renderTags(roleTagsContainer, selectedRoles, removeRole);
        if (specialtyTagsContainer) renderTags(specialtyTagsContainer, selectedSpecialties, removeSpecialty);
        if (roleOptionsContainer) updateOptionHighlights(roleOptionsContainer, selectedRoles);
        if (specialtyOptionsContainer) updateOptionHighlights(specialtyOptionsContainer, selectedSpecialties);
        if (specialtyGroup) specialtyGroup.style.display = '';
    }

    // === MODAL LOGIC ===
    if (addDoctorBtn) {
        if (!isAdmin) {
            addDoctorBtn.style.display = 'none';
        } else {
            addDoctorBtn.addEventListener("click", () => {
                document.querySelector("#doctor-modal h2").textContent = "თანამშრომლის დამატება";
                document.querySelector("#doctor-form .submit-btn").textContent = "შენახვა";
                document.getElementById("doctor-edit-id").value = "";
                doctorForm.reset();
                resetSelections();
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                doctorModal.style.display = "block";
                document.body.style.overflow = "hidden";
            });
        }
    }

    if (closeDoctorModalBtn) {
        closeDoctorModalBtn.addEventListener("click", () => {
            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === doctorModal) {
            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

    // === FORM SUBMISSION ===
    if (doctorForm && isAdmin) {
        doctorForm.addEventListener("submit", function (e) {
            e.preventDefault();

            // Validate roles
            if (selectedRoles.length === 0) {
                alert("გთხოვთ აირჩიოთ მინიმუმ ერთი როლი.");
                return;
            }

            // Check if specialty is needed
            const requiresSpecialty = selectedRoles.some(role => !nonMedicalRoles.includes(role));
            if (requiresSpecialty && selectedSpecialties.length === 0) {
                alert("გთხოვთ აირჩიოთ მინიმუმ ერთი სპეციალობა.");
                return;
            }

            const editId = document.getElementById("doctor-edit-id").value;
            const signatureData = canvas ? canvas.toDataURL() : null;

            const roleVal = selectedRoles.join(", ");
            const specialtyVal = requiresSpecialty ? selectedSpecialties.join(", ") : "";

            const newDoctor = {
                firstName: document.getElementById("docFirstName").value,
                lastName: document.getElementById("docLastName").value,
                role: roleVal,
                id: document.getElementById("docId").value,
                specialty: specialtyVal,
                phone: document.getElementById("docPhone").value,
                email: document.getElementById("docEmail").value,
                username: document.getElementById("docUsername").value,
                password: document.getElementById("docPassword").value,
                signature: signatureData,
                createdAt: editId ? undefined : new Date().toISOString()
            };

            let doctors = JSON.parse(localStorage.getItem("doctors")) || [];

            if (editId) {
                if (editId !== newDoctor.id && doctors.some(d => d.id === newDoctor.id)) {
                    alert("თანამშრომელი ამ ID-ით უკვე არსებობს.");
                    return;
                }
                const index = doctors.findIndex(d => d.id === editId);
                if (index !== -1) {
                    newDoctor.createdAt = doctors[index].createdAt;
                    doctors[index] = newDoctor;
                    localStorage.setItem("doctors", JSON.stringify(doctors));
                    alert("თანამშრომლის მონაცემები განახლდა!");
                }
            } else {
                if (doctors.some(d => d.id === newDoctor.id)) {
                    alert("თანამშრომელი ამ ID-ით უკვე არსებობს.");
                    return;
                }
                if (doctors.some(d => d.username === newDoctor.username)) {
                    alert("თანამშრომელი ამ მომხმარებლის სახელით უკვე არსებობს.");
                    return;
                }
                doctors.push(newDoctor);
                localStorage.setItem("doctors", JSON.stringify(doctors));
                alert("თანამშრომელი წარმატებით დაემატა! ახლა მას შეუძლია ავტორიზაცია.");
            }

            doctorModal.style.display = "none";
            document.body.style.overflow = "auto";
            renderDoctors();
        });
    }

    // === SEARCH ===
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderDoctors(e.target.value);
        });
    }

    // === DELETE ===
    window.deleteDoctor = function (id) {
        if (!isAdmin) return;
        if (confirm("დარწმუნებული ხართ, რომ გსურთ ამ თანამშრომლის წაშლა?")) {
            let doctors = JSON.parse(localStorage.getItem("doctors")) || [];
            doctors = doctors.filter(d => d.id !== id);
            localStorage.setItem("doctors", JSON.stringify(doctors));
            renderDoctors(searchInput ? searchInput.value : "");
        }
    };

    // === EDIT ===
    window.openEditDoctorModal = function (id) {
        if (!isAdmin) return;
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const doctor = doctors.find(d => d.id === id);

        if (doctor) {
            document.querySelector("#doctor-modal h2").textContent = "თანამშრომლის რედაქტირება";
            document.querySelector("#doctor-form .submit-btn").textContent = "განახლება";
            document.getElementById("doctor-edit-id").value = doctor.id;

            // Set roles
            selectedRoles = doctor.role ? doctor.role.split(", ").filter(r => r) : [];
            renderTags(roleTagsContainer, selectedRoles, removeRole);
            updateOptionHighlights(roleOptionsContainer, selectedRoles);

            document.getElementById("docFirstName").value = doctor.firstName;
            document.getElementById("docLastName").value = doctor.lastName;
            document.getElementById("docId").value = doctor.id;

            // Set specialties
            selectedSpecialties = doctor.specialty ? doctor.specialty.split(", ").filter(s => s) : [];
            renderTags(specialtyTagsContainer, selectedSpecialties, removeSpecialty);
            updateOptionHighlights(specialtyOptionsContainer, selectedSpecialties);

            document.getElementById("docPhone").value = doctor.phone || "";
            document.getElementById("docEmail").value = doctor.email || "";
            document.getElementById("docUsername").value = doctor.username || "";
            document.getElementById("docPassword").value = doctor.password || "";

            toggleSpecialty();
            loadSignature(doctor.signature);

            doctorModal.style.display = "block";
            document.body.style.overflow = "hidden";
        }
    };

    // === DETAILS ===
    window.showDoctorDetails = function (id) {
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        const doctor = doctors.find(d => d.id === id);
        if (!doctor) return;

        let content = `
            <div style="line-height: 1.6;">
                <p><strong>სახელი გვარი:</strong> ${doctor.firstName} ${doctor.lastName}</p>
                <p><strong>როლი:</strong> ${doctor.role}</p>
                <p><strong>ID:</strong> ${doctor.id}</p>
                ${doctor.specialty ? `<p><strong>სპეციალობა:</strong> ${doctor.specialty}</p>` : ''}
                <p><strong>ტელეფონი:</strong> ${doctor.phone || "N/A"}</p>
                <p><strong>ელ-ფოსტა:</strong> ${doctor.email || "N/A"}</p>
            </div>
        `;

        if (isAdmin) {
            content += `
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;">
                <div style="background: #f9f9f9; padding: 10px; border-radius: 4px;">
                    <p><strong>მომხმარებელი:</strong> ${doctor.username || "N/A"}</p>
                    <p><strong>პაროლი:</strong> ${doctor.password || "N/A"}</p>
                </div>
            `;
        }

        if (window.showCustomModal) {
            window.showCustomModal("თანამშრომლის დეტალები", content);
        } else {
            alert("დეტალები:\n" + content.replace(/<[^>]*>?/gm, ' '));
        }
    };

    function renderDoctors(searchTerm = "") {
        const doctors = JSON.parse(localStorage.getItem("doctors")) || [];
        doctorsListContainer.innerHTML = "";

        if (doctors.length === 0) {
            doctorsListContainer.innerHTML = '<div class="no-data">თანამშრომლები არ მოიძებნა.</div>';
            return;
        }

        const filtered = doctors.filter(d =>
            d.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.id.includes(searchTerm) ||
            (d.specialty && d.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.role && d.role.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        if (filtered.length === 0) {
            doctorsListContainer.innerHTML = '<div class="no-data">შესაბამისი თანამშრომლები არ მოიძებნა.</div>';
            return;
        }

        filtered.forEach(d => {
            const card = document.createElement("div");
            card.className = "patient-card";

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

            card.innerHTML = `
                <div class="patient-header">
                    <div class="patient-avatar" style="background-color: #e3f2fd; color: #1976d2;">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="patient-info-main">
                        <h3>${d.firstName} ${d.lastName}</h3>
                        <span class="patient-id">ID: ${d.id} <small>(${d.role || 'ექიმი'})</small></span>
                    </div>
                    ${d.specialty ? `<div class="patient-status" style="background-color: #1a73e8;">${d.specialty}</div>` : ''}
                </div>
                <div class="patient-body">
                    <p><strong>ტელეფონი:</strong> ${d.phone || "N/A"}</p>
                    <p><strong>ელ-ფოსტა:</strong> ${d.email || "N/A"}</p>
                </div>
                <div class="patient-footer" style="display: flex; gap: 10px;">
                    ${buttonsHtml}
                </div>
            `;

            const detailsBtn = card.querySelector(".details-btn");
            if (detailsBtn) detailsBtn.addEventListener("click", () => showDoctorDetails(d.id));

            if (isAdmin) {
                const editBtn = card.querySelector(".edit-btn");
                if (editBtn) editBtn.addEventListener("click", () => openEditDoctorModal(d.id));
                const deleteBtn = card.querySelector(".delete-btn");
                if (deleteBtn) deleteBtn.addEventListener("click", () => deleteDoctor(d.id));
            }

            doctorsListContainer.appendChild(card);
        });
    }

    function seedDoctors() {
        if (!localStorage.getItem("doctors")) {
            localStorage.setItem("doctors", JSON.stringify([]));
        }
    }
});
