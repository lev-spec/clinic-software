document.addEventListener("DOMContentLoaded", function() {
    const backupBtn = document.getElementById("backup-btn");
    const restoreBtn = document.getElementById("restore-btn");
    const restoreInput = document.getElementById("restore-input");
    
    // --- Role Check ---
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    const isAdmin = currentUser && currentUser.role === 'admin';
    const clinicNameInput = document.getElementById("clinic-name-input");
    
    if (clinicNameInput) {
        if (!isAdmin) {
            clinicNameInput.disabled = true;
            clinicNameInput.style.backgroundColor = "#f0f0f0";
            clinicNameInput.style.color = "#999";
            clinicNameInput.title = "მხოლოდ ადმინისტრატორს შეუძლია შეცვლა";
        }
    }

    if (backupBtn) {
        backupBtn.addEventListener("click", function() {
            const data = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                data[key] = localStorage.getItem(key);
            }
            
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement("a");
            a.href = url;
            const date = new Date().toISOString().split('T')[0];
            a.download = `clinic_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    if (restoreBtn && restoreInput) {
        restoreBtn.addEventListener("click", function() {
            restoreInput.click();
        });

        restoreInput.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm("ეს მოქმედება წაშლის ყველა არსებულ მონაცემს და ჩაანაცვლებს ფაილიდან მიღებული მონაცემებით. დარწმუნებული ხართ?")) {
                        localStorage.clear();
                        Object.keys(data).forEach(key => {
                            localStorage.setItem(key, data[key]);
                        });
                        alert("მონაცემები წარმატებით აღდგა!");
                        location.reload();
                    }
                } catch (error) {
                    alert("შეცდომა ფაილის კითხვისას: " + error.message);
                }
            };
            reader.readAsText(file);
        });
    }
});
