// Data setup
const counselors = [
	{ 
		id: "armstrong_bridget", 
		lastName: "Armstrong", 
		firstName: "Bridget", 
		role: "Counselor",
		email: "Bridget.Armstrong@cttech.org",
		phone: "(860) 456-3879"
	},
	{ 
		id: "lima_pedro", 
		lastName: "Lima", 
		firstName: "Pedro", 
		role: "Counselor",
		email: "Pedro.Lima@cttech.org",
		phone: "(860) 456-3879"
	},
	{ 
		id: "jones_laura", 
		lastName: "Jones", 
		firstName: "Laura", 
		role: "Director of Counseling and Admissions",
		email: "Laura.Jones@cttech.org",
		phone: "(860) 456-3879"
	},
	{ 
		id: "wilson_taryn", 
		lastName: "Wilson", 
		firstName: "Taryn", 
		role: "School Psychologist",
		email: "taryn.wilson@cttech.org",
		phone: "860-456-3879"
	},
	{ 
		id: "scheff_elizabeth", 
		lastName: "Scheff", 
		firstName: "Elizabeth", 
		role: "Social Worker",
		email: "Elizabeth.Scheff@cttech.org",
		phone: "(860) 456-3879"
	},
	{ 
		id: "boothroyd_stacy", 
		lastName: "Boothroyd", 
		firstName: "Stacy", 
		role: "Dean of Students",
		email: "Stacy.Boothroyd@cttech.org",
		phone: "(860) 456-3879"
	}
];

// Utilities
function toTitleCase(text){
	return text.replace(/\w\S*/g, s => s.charAt(0).toUpperCase() + s.slice(1));
}
function formatDateTimeISO(date){
	return new Date(date).toISOString();
}
function formatDateTimeReadable(date){
	return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}
function uid(){
	return Math.random().toString(36).slice(2, 7) + "-" + Date.now().toString(36).slice(-5);
}
function clampToSchoolHours(date){
	const d = new Date(date);
	const hour = d.getHours();
	if (hour < 8) d.setHours(8, 0, 0, 0);
	if (hour > 15 || (hour === 15 && d.getMinutes() > 30)) d.setHours(15, 30, 0, 0);
	return d;
}
function isWeekend(date){
	const d = new Date(date);
	const day = d.getDay();
	return day === 0 || day === 6;
}
function nextSchoolTimeSlot(fromDate){
	const slotMs = 15 * 60 * 1000;
	let t = new Date(fromDate);
	// Round up to next 15-min increment
	const ms = t.getMinutes() * 60 * 1000 + t.getSeconds() * 1000 + t.getMilliseconds();
	const remainder = ms % slotMs;
	if (remainder !== 0) t = new Date(t.getTime() + (slotMs - remainder));
	// Skip to weekday and school hours
	while (true){
		if (isWeekend(t)){
			// Move to Monday 8:00
			t.setDate(t.getDate() + (8 - t.getDay()));
			t.setHours(8, 0, 0, 0);
			continue;
		}
		const within = clampToSchoolHours(t);
		if (within.getTime() !== t.getTime()){
			// out of hours -> move to start
			t = within;
			continue;
		}
		break;
	}
	return t;
}

function generateDailySlots(forDate){
	// School hours: 8:00 to 15:30 inclusive in 15-min increments
	const start = new Date(forDate); start.setHours(8,0,0,0);
	const end = new Date(forDate); end.setHours(15,30,0,0);
  const slots = [];
	for (let t = new Date(start); t <= end; t = new Date(t.getTime() + 15*60*1000)){
		slots.push(new Date(t));
	}
  return slots;
}

function availableSlotsFor(counselorId, dateOnly){
	// dateOnly: Date at any time; we constrain to that date
	const day = new Date(dateOnly); day.setHours(0,0,0,0);
	if (isWeekend(day)) return [];
	const all = generateDailySlots(day);
	const now = new Date();
	return all.filter(t => {
		// future-or-now slots only
		if (t.toDateString() === now.toDateString() && t.getTime() < nextSchoolTimeSlot(now).getTime()) return false;
		const iso = formatDateTimeISO(t);
		return !isSlotTaken(counselorId, iso);
	});
}

// Persistence
const STORAGE_KEY = "guidance_pro_appointments_v1";
function loadAppointments(){
	try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }catch{ return []; }
}
function saveAppointments(list){
	localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

// State
let appointments = loadAppointments();

// Render directory
function renderDirectory(filter = ""){
	const list = document.getElementById("counselorList");
	list.innerHTML = "";
	const q = filter.trim().toLowerCase();
	const filtered = counselors.filter(c => {
		const name = `${c.lastName}, ${c.firstName}`.toLowerCase();
		const role = c.role.toLowerCase();
		return !q || name.includes(q) || role.includes(q);
	});
	for (const c of filtered){
		const li = document.createElement("li");
		li.className = "card clickable";
		li.innerHTML = `
			<div class="avatar">${c.lastName[0]}${c.firstName[0]}</div>
			<div>
				<h3>${c.lastName}, ${c.firstName}</h3>
				<p>${c.role}</p>
				<div class="tags">
					<span class="badge ${roleToClass(c.role)}">${roleShort(c.role)}</span>
				</div>
			</div>
		`;
		li.addEventListener('click', () => {
			showCounselorInfo(c);
		});
		list.appendChild(li);
	}
}
function roleShort(role){
	if (/director/i.test(role)) return "Director";
	if (/psych/i.test(role)) return "Psychologist";
	if (/social/i.test(role)) return "Social Worker";
	if (/dean/i.test(role)) return "Dean";
	return "Counselor";
}
function roleToClass(role){
	if (/director/i.test(role)) return "role-director";
	if (/psych/i.test(role)) return "role-psych";
	if (/social/i.test(role)) return "role-social";
	if (/dean/i.test(role)) return "role-dean";
	return "role-counselor";
}

function findNextAvailableSlot() {
    const now = new Date();
    for (let i = 0; i < 14; i++) { // Look ahead 2 weeks
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        
        if (!isWeekend(date)) {
            for (const c of counselors) {
                const slots = availableSlotsFor(c.id, date);
                if (slots.length > 0) {
                    return slots[0];
                }
            }
        }
    }
    return null;
}

// Populate select
function populateSelect(){
	const select = document.getElementById("counselorSelect");
	// Check if there's a counselor parameter in the URL
	const params = new URLSearchParams(window.location.search);
	const preselectedCounselor = params.get('counselor');
	
	select.innerHTML = counselors.map(c => 
		`<option value="${c.id}" ${c.id === preselectedCounselor ? 'selected' : ''}>${c.lastName}, ${c.firstName} — ${roleShort(c.role)}</option>`
	).join("");
}

// Appointment helpers
function isSlotTaken(counselorId, startIso){
	return appointments.some(a => a.counselorId === counselorId && a.start === startIso);
}
function findEarliestAcrossAll(startFrom){
	let t = nextSchoolTimeSlot(startFrom);
	for (let i = 0; i < 8 * 24 * 4; i++){
		// Search up to ~8 weeks
		for (const c of counselors){
			const iso = formatDateTimeISO(t);
			if (!isSlotTaken(c.id, iso)){
				return { when: new Date(t), counselor: c };
			}
		}
		t = new Date(t.getTime() + 15 * 60 * 1000);
		t = nextSchoolTimeSlot(t);
  }
  return null;
}

function addAppointment({ studentName, reason, counselorId, start }){
	const appt = {
		id: uid(),
		studentName: toTitleCase(studentName.trim()),
		reason: reason.trim(),
		counselorId,
		start,
		createdAt: formatDateTimeISO(new Date())
	};
	appointments.push(appt);
	saveAppointments(appointments);
	renderAppointments();
	showReceipt(appt);
}

function cancelAppointment(id){
    const appt = appointments.find(a => a.id === id);
    if (!appt) {
        alert('Appointment not found.');
        return;
    }

    const appointmentDate = new Date(appt.start);
    const now = new Date();

    // Check if appointment is in the past
    if (appointmentDate < now) {
        alert('Cannot cancel past appointments.');
        return;
    }

    const counselor = counselorById(appt.counselorId);
    const timeUntil = appointmentDate - now;
    const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
    
    let confirmMessage = `Are you sure you want to cancel your appointment with ${counselor.firstName} ${counselor.lastName}?\n\nAppointment Details:\nDate: ${formatDateTimeReadable(appointmentDate)}\nStudent: ${appt.studentName}`;
    
    if (hoursUntil < 24) {
        confirmMessage = `⚠️ WARNING: This appointment is in less than 24 hours!\n\n${confirmMessage}`;
    }

    if (confirm(confirmMessage)) {
        // Find the card element to animate
        const card = document.querySelector(`[data-appointment-id="${id}"]`);
        if (card) {
            card.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                // Remove from data and update storage
                appointments = appointments.filter(a => a.id !== id);
                saveAppointments(appointments);
                renderAppointments();
            }, 300);
        } else {
            // If card not found, just update data
            appointments = appointments.filter(a => a.id !== id);
            saveAppointments(appointments);
            renderAppointments();
        }
    }
}

function counselorById(id){
	return counselors.find(c => c.id === id);
}

function resetAllAppointments() {
    const confirmMessage = 
        "⚠️ WARNING: This will permanently delete ALL appointments!\n\n" +
        "Are you absolutely sure you want to reset all appointments?\n" +
        "This action cannot be undone.";

    if (confirm(confirmMessage)) {
        // Double-check confirmation for safety
        if (confirm("🚨 FINAL WARNING: All appointments will be deleted. Continue?")) {
            // Create fade out animation for all appointment cards
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.animation = 'fadeOut 0.5s ease forwards';
            });

            // Wait for animation to complete then clear appointments
            setTimeout(() => {
                appointments = [];
                saveAppointments(appointments);
                renderAppointments();
                
                // Show success message
                alert("All appointments have been successfully reset.");
            }, 500);
        }
    }
}

function renderAppointments(){
    const list = document.getElementById("appointmentsList");
    if (!list) return; // Only run on appointments page
    
    // Set up reset button handler
    const resetBtn = document.getElementById('resetAppointments');
    if (resetBtn) {
        // Remove any existing listeners
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        newResetBtn.addEventListener('click', resetAllAppointments);
    }
    
    list.innerHTML = "";
    const now = new Date();
    
    // Sort all appointments by date
    const sorted = [...appointments].sort((a,b) => new Date(a.start) - new Date(b.start));
    
    // Update stats
    const upcoming = sorted.filter(a => new Date(a.start) >= now);
    const thisWeek = sorted.filter(a => {
        const apptDate = new Date(a.start);
        const weekFromNow = new Date(now);
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return apptDate >= now && apptDate <= weekFromNow;
    });
    
    document.getElementById('totalAppointments').textContent = sorted.length;
    document.getElementById('upcomingAppointments').textContent = upcoming.length;
    document.getElementById('thisWeekAppointments').textContent = thisWeek.length;
    
    // Find next available slot
    const nextSlot = findNextAvailableSlot();
    document.getElementById('nextAvailable').textContent = nextSlot ? 
        formatDateTimeReadable(nextSlot).split(',')[0] : 'Check Calendar';
    
    // Show/hide empty state
    const emptyState = document.getElementById('emptyState');
    if (sorted.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    } else {
        list.style.display = 'block';
        emptyState.style.display = 'none';
    }
    
    // Set up filters
    const filterButtons = document.querySelectorAll('.filter-buttons .btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredAppointments(sorted, btn.dataset.filter);
        });
    });

    // Set up search
    const searchInput = document.getElementById('appointmentSearch');
    searchInput.addEventListener('input', () => {
        const activeFilter = document.querySelector('.filter-buttons .btn.active').dataset.filter;
        renderFilteredAppointments(sorted, activeFilter, searchInput.value);
    });

    // Initial render with all appointments
    renderFilteredAppointments(sorted, 'all');
}

function renderFilteredAppointments(appointments, filter, searchTerm = '') {
    const list = document.getElementById('appointmentsList');
    const now = new Date();
    
    // Apply filters
    let filtered = appointments;
    switch(filter) {
        case 'upcoming':
            filtered = appointments.filter(a => new Date(a.start) >= now);
            break;
        case 'today':
            filtered = appointments.filter(a => {
                const apptDate = new Date(a.start);
                return apptDate.toDateString() === now.toDateString();
            });
            break;
        case 'past':
            filtered = appointments.filter(a => new Date(a.start) < now);
            break;
    }
    
    // Apply search
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(a => {
            const c = counselorById(a.counselorId);
            return a.studentName.toLowerCase().includes(term) ||
                   a.reason.toLowerCase().includes(term) ||
                   c.firstName.toLowerCase().includes(term) ||
                   c.lastName.toLowerCase().includes(term);
        });
    }
    
    list.innerHTML = '';
    
    for (const a of filtered) {
        const c = counselorById(a.counselorId);
        const li = document.createElement("li");
        const appointmentDate = new Date(a.start);
        const isUpcoming = appointmentDate > new Date();
        const isToday = appointmentDate.toDateString() === new Date().toDateString();
        const isWithin24Hours = appointmentDate - new Date() < 24 * 60 * 60 * 1000;
        
        li.className = `card ${isUpcoming ? 'upcoming' : 'past'}`;
        li.setAttribute('data-appointment-id', a.id);
        li.innerHTML = `
            <div class="appointment-card-content">
                <div class="appointment-left">
                    <div class="avatar ${isWithin24Hours ? 'urgent' : ''}">${c.lastName[0]}${c.firstName[0]}</div>
                    <div class="appointment-main">
                        <div class="appointment-header">
                            <h3>${c.lastName}, ${c.firstName}</h3>
                            <span class="appointment-time ${isWithin24Hours ? 'urgent' : ''}">${formatDateTimeReadable(a.start)}</span>
                        </div>
                        <div class="appointment-details">
                            <p><strong>Student:</strong> ${a.studentName}</p>
                            <p><strong>Reason:</strong> ${a.reason}</p>
                            <p class="contact-info">
                                <strong>Contact:</strong> 
                                <a href="mailto:${c.email}" class="contact-link">${c.email}</a> | 
                                <a href="tel:${c.phone}" class="contact-link">${c.phone}</a>
                            </p>
                        </div>
                        <div class="tags">
                            <span class="badge ${roleToClass(c.role)}">${roleShort(c.role)}</span>
                            ${isToday ? '<span class="badge badge-today">Today</span>' : ''}
                            ${isWithin24Hours && isUpcoming ? '<span class="badge badge-urgent">Within 24 Hours</span>' : ''}
                            ${!isUpcoming ? '<span class="badge badge-past">Past</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-secondary view-receipt" data-print="${a.id}">
                        <span class="btn-icon">�</span> View Receipt
                    </button>
                    ${isUpcoming ? `
                        <button class="btn ${isWithin24Hours ? 'btn-danger' : 'btn-cancel'}" data-cancel="${a.id}">
                            <span class="btn-icon">✕</span> Cancel Appointment
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        list.appendChild(li);
    }
    
    // Add upcoming appointments
    if (upcoming.length > 0) {
        const upcomingHeader = document.createElement('li');
        upcomingHeader.className = 'list-header';
        upcomingHeader.innerHTML = '<h3>Upcoming Appointments</h3>';
        newList.appendChild(upcomingHeader);
        
        for (const a of upcoming) {
            const c = counselorById(a.counselorId);
            const li = document.createElement("li");
            li.className = "card appointment-card";
            
            // Calculate if the appointment is within 24 hours
            const appointmentTime = new Date(a.start);
            const isWithin24Hours = appointmentTime - now < 24 * 60 * 60 * 1000;
            
            li.innerHTML = `
                <div class="avatar">${c.lastName[0]}${c.firstName[0]}</div>
                <div class="appointment-details">
                    <div class="appointment-header">
                        <h3>${c.lastName}, ${c.firstName}</h3>
                        <span class="appointment-date ${isWithin24Hours ? 'soon' : ''}">${formatDateTimeReadable(new Date(a.start))}</span>
                    </div>
                    <div class="counselor-info">
                        <p><strong>Role:</strong> ${c.role}</p>
                        <p><strong>Contact:</strong> 
                            <a href="mailto:${c.email}" class="contact-link">${c.email}</a> | 
                            <a href="tel:${c.phone}" class="contact-link">${c.phone}</a>
                        </p>
                    </div>
                    <div class="student-info">
                        <p><strong>Student:</strong> ${a.studentName}</p>
                        <p><strong>Reason:</strong> ${a.reason}</p>
                    </div>
                    <div class="appointment-footer">
                        <div class="tags">
                            <span class="badge ${roleToClass(c.role)}">${roleShort(c.role)}</span>
                            <span class="badge badge-upcoming">Upcoming</span>
                            ${isWithin24Hours ? '<span class="badge badge-soon">Within 24 Hours</span>' : ''}
                        </div>
                        <div class="actions">
                            <button class="btn btn-ghost view-receipt">
                                <span class="btn-icon">📄</span> Receipt
                            </button>
                            <button class="btn btn-danger cancel-appointment" title="Cancel this appointment">
                                <span class="btn-icon">❌</span> Cancel
                            </button>
                        </div>
                    </div>
                </div>
            `;
            newList.appendChild(li);
        }
    }

    // Add past appointments
    if (past.length > 0) {
        const pastHeader = document.createElement('li');
        pastHeader.className = 'list-header';
        pastHeader.innerHTML = '<h3>Past Appointments</h3>';
        list.appendChild(pastHeader);
        
        for (const a of past) {
            const c = counselorById(a.counselorId);
            const li = document.createElement("li");
            li.className = "card appointment-card past";
            li.innerHTML = `
                <div class="avatar">${c.lastName[0]}${c.firstName[0]}</div>
                <div class="appointment-details">
                    <div class="appointment-header">
                        <h3>${c.lastName}, ${c.firstName}</h3>
                        <span class="appointment-date">${formatDateTimeReadable(new Date(a.start))}</span>
                    </div>
                    <div class="counselor-info">
                        <p><strong>Role:</strong> ${c.role}</p>
                        <p><strong>Contact:</strong> 
                            <a href="mailto:${c.email}" class="contact-link">${c.email}</a> | 
                            <a href="tel:${c.phone}" class="contact-link">${c.phone}</a>
                        </p>
                    </div>
                    <div class="student-info">
                        <p><strong>Student:</strong> ${a.studentName}</p>
                        <p><strong>Reason:</strong> ${a.reason}</p>
                    </div>
                    <div class="appointment-footer">
                        <div class="tags">
                            <span class="badge ${roleToClass(c.role)}">${roleShort(c.role)}</span>
                            <span class="badge badge-past">Past</span>
                        </div>
                        <div class="actions">
                            <button class="btn btn-ghost" data-print="${a.id}">Receipt</button>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(li);
        }
    }

    // Handle button clicks
    list.addEventListener("click", e => {
        // Find the closest button to the clicked element
        const btn = e.target.closest("button");
        if (!btn) return; // If no button was clicked, exit
        
        // Get the closest appointment card
        const card = btn.closest('[data-appointment-id]');
        if (!card) return;
        
        const appointmentId = card.getAttribute('data-appointment-id');
        if (!appointmentId) return;
        
        // Prevent any default behavior
        e.preventDefault();
        e.stopPropagation();
        
        // Add visual feedback for the click
        btn.classList.add('btn-clicked');
        setTimeout(() => btn.classList.remove('btn-clicked'), 200);
        
        if (btn.classList.contains('view-receipt')) {
            // Handle receipt button click
            const appt = appointments.find(a => a.id === appointmentId);
            if (appt) {
                btn.disabled = true; // Prevent double-clicks
                showReceipt(appt);
                setTimeout(() => btn.disabled = false, 500);
            } else {
                alert("Could not find appointment details.");
            }
        }
        
        if (btn.hasAttribute("data-cancel")) {
            // Handle cancel button click
            const appointmentId = btn.getAttribute("data-cancel");
            const appt = appointments.find(a => a.id === appointmentId);
            if (appt) {
                btn.disabled = true; // Prevent double-clicks
                cancelAppointment(appointmentId);
                setTimeout(() => btn.disabled = false, 500);
            } else {
                alert("Could not find appointment to cancel.");
            }
        }
    });

    if (sorted.length === 0){
        const empty = document.createElement("div");
        empty.className = "card empty-state";
        empty.innerHTML = `
            <div class="avatar">📅</div>
            <div>
                <h3>No appointments yet</h3>
                <p>Booked times will appear here.</p>
                <a href="booking.html" class="btn" style="margin-top:12px">Book an Appointment</a>
            </div>
        `;
        list.appendChild(empty);
	}
}

// Receipt
function showReceipt(appt){
	const c = counselorById(appt.counselorId);
	const body = document.getElementById("receiptBody");
	const isUpcoming = new Date(appt.start) > new Date();
	
	body.innerHTML = `
		<div class="receipt-content">
			<p><strong>Student Name:</strong> ${escapeHtml(appt.studentName)}</p>
			<p><strong>Counselor:</strong> ${c.lastName}, ${c.firstName}</p>
			<p><strong>Role:</strong> ${roleShort(c.role)}</p>
			<p><strong>Appointment Time:</strong> ${formatDateTimeReadable(appt.start)}</p>
			<p><strong>Reason for Visit:</strong> ${escapeHtml(appt.reason)}</p>
			<p><strong>Contact Information:</strong></p>
			<p class="indent">
				Email: <a href="mailto:${c.email}" class="contact-link">${c.email}</a><br>
				Phone: <a href="tel:${c.phone}" class="contact-link">${c.phone}</a>
			</p>
			<p><strong>Contract ID:</strong> ${appt.id}</p>
			<p><strong>Agreement:</strong><br>
			I agree to arrive on time. This scheduled time is reserved and should not be taken by others.</p>
		</div>
		${isUpcoming ? `
			<div class="actions" style="justify-content: center; margin-top: 16px;">
				<button id="cancelFromReceipt" class="btn btn-danger">Cancel Appointment</button>
			</div>
		` : ''}
	`;
	
	const dialog = document.getElementById("receiptDialog");
	dialog.showModal();
	
	const onPrint = () => { window.print(); };
	const onClose = () => { dialog.close(); cleanup(); };
	const onCancel = () => {
		if (confirm("Are you sure you want to cancel this appointment?")) {
			cancelAppointment(appt.id);
			dialog.close();
		}
	};
	
	document.getElementById("printReceipt").addEventListener("click", onPrint, { once: true });
	document.getElementById("closeReceipt").addEventListener("click", onClose, { once: true });
	
	if (isUpcoming) {
		document.getElementById("cancelFromReceipt").addEventListener("click", onCancel, { once: true });
	}
	
	function cleanup(){
		// no-op, listeners are once:true
	}
}
function escapeHtml(s){
	return s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",
		">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function showCounselorInfo(counselor) {
	const dialog = document.createElement('dialog');
	dialog.className = 'counselor-info-dialog';
	
	const today = new Date();
	const availableSlots = availableSlotsFor(counselor.id, today);
	const nextAvailable = availableSlots.length > 0 ? formatDateTimeReadable(availableSlots[0]) : 'No available slots today';
	
	// Get counselor's appointments
	const counselorAppointments = appointments
		.filter(a => a.counselorId === counselor.id)
		.sort((a, b) => new Date(a.start) - new Date(b.start));
	
	// Group appointments by date
	const appointmentsByDate = {};
	counselorAppointments.forEach(appt => {
		const date = new Date(appt.start).toLocaleDateString();
		if (!appointmentsByDate[date]) {
			appointmentsByDate[date] = [];
		}
		appointmentsByDate[date].push(appt);
	});
	
	// Generate appointments HTML
	let appointmentsHtml = '';
	if (counselorAppointments.length > 0) {
		appointmentsHtml = Object.entries(appointmentsByDate).map(([date, appts]) => `
			<div class="appointment-date">
				<h4>${date}</h4>
				${appts.map(appt => `
					<div class="appointment-item">
						<div class="appointment-time">${new Date(appt.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
						<div class="appointment-details">
							<div class="appointment-name">${appt.studentName}</div>
							<div class="appointment-reason">${appt.reason}</div>
						</div>
					</div>
				`).join('')}
			</div>
		`).join('');
	} else {
		appointmentsHtml = '<p class="no-appointments">No scheduled appointments</p>';
	}
	
	dialog.innerHTML = `
		<div class="info-content">
			<div class="counselor-header">
				<div class="avatar large">${counselor.lastName[0]}${counselor.firstName[0]}</div>
				<div class="counselor-header-info">
					<h2>${counselor.lastName}, ${counselor.firstName}</h2>
					<div class="badge ${roleToClass(counselor.role)}">${roleShort(counselor.role)}</div>
				</div>
			</div>
			<div class="counselor-details">
				<div class="contact-info">
					<p><strong>Email:</strong> <a href="mailto:${counselor.email}" class="contact-link">${counselor.email}</a></p>
					<p><strong>Phone:</strong> <a href="tel:${counselor.phone}" class="contact-link">${counselor.phone}</a></p>
				</div>
				<p><strong>Next Available:</strong> ${nextAvailable}</p>
				<p><strong>Specializes in:</strong> Student guidance, academic planning, and personal counseling</p>
			</div>
			<div class="appointments-section">
				<h3>Scheduled Appointments</h3>
				<div class="appointments-list">
					${appointmentsHtml}
				</div>
			</div>
			<div class="actions">
				<button class="btn" onclick="window.location.href='booking.html?counselor=${counselor.id}'">Book Appointment</button>
				<button class="btn btn-ghost" onclick="this.closest('dialog').close()">Close</button>
			</div>
		</div>
	`;
	
	document.body.appendChild(dialog);
	dialog.showModal();
	
	dialog.addEventListener('close', () => {
		document.body.removeChild(dialog);
	});
}

// Form handling
function handleForm(){
	const form = document.getElementById("bookingForm");
	form.addEventListener("submit", e => {
		e.preventDefault();
		const fd = new FormData(form);
		const studentName = String(fd.get("studentName") || "");
		const reason = String(fd.get("reason") || "");
		const counselorId = String(fd.get("counselorId") || counselors[0].id);
		const date = String(fd.get("date") || "");
		const time = String(fd.get("time") || "");
		if (!studentName || !reason || !date || !time){
			alert("Please fill all fields.");
			return;
		}
		const start = new Date(`${date}T${time}`);
		const startIso = formatDateTimeISO(start);
		if (isSlotTaken(counselorId, startIso)){
			alert("That time is already booked for this staff member. Choose another.");
			return;
		}
		addAppointment({ studentName, reason, counselorId, start: startIso });
		form.reset();
		refreshTimeOptions();
		// Redirect to appointments page after a short delay to show the receipt
		setTimeout(() => {
			window.location.href = 'appointments.html';
		}, 2000);
	});
}

// Urgent scheduling
function handleUrgent(){
	const btn = document.getElementById("urgentButton");
	btn.addEventListener("click", () => {
		const name = prompt("For urgent help, enter your full name:");
		if (!name) return;
		const reason = prompt("Briefly describe why this is urgent (safety, immediate need):");
		if (!reason) return;
		const earliest = findEarliestAcrossAll(new Date());
		if (!earliest){
			alert("No available slots found soon. Please try standard booking.");
      return;
    }
		addAppointment({
			studentName: name,
			reason: `[URGENT] ${reason}`,
			counselorId: earliest.counselor.id,
			start: formatDateTimeISO(earliest.when)
		});
		// Keep UI in sync
		refreshTimeOptions();
		// Redirect to appointments page after a short delay to show the receipt
		setTimeout(() => {
			window.location.href = 'appointments.html';
		}, 2000);
	});
}

// Clear all (demo)
function handleClearAll(){
	document.getElementById("clearAll").addEventListener("click", () => {
		if (confirm("Clear ALL appointments on this device?")){
			appointments = [];
    saveAppointments(appointments);
			renderAppointments();
		}
	});
}

// Search
function handleSearch(){
	const input = document.getElementById("searchInput");
	input.addEventListener("input", () => renderDirectory(input.value));
}

// Dynamic time options
function refreshTimeOptions(){
	const counselorId = document.getElementById("counselorSelect").value || counselors[0].id;
	const dateStr = document.getElementById("date").value;
	const timeSelect = document.getElementById("timeSelect");
	const help = document.getElementById("timeHelp");
	if (!dateStr){
		timeSelect.innerHTML = "<option value='' disabled selected>Select a date first</option>";
		help.textContent = "";
		return;
	}
	const date = new Date(`${dateStr}T00:00`);
	if (isWeekend(date)){
		timeSelect.innerHTML = "<option value='' disabled selected>No school hours on weekends</option>";
		help.textContent = "Pick a weekday.";
		return;
	}
	const avail = availableSlotsFor(counselorId, date);
	if (avail.length === 0){
		timeSelect.innerHTML = "<option value='' disabled selected>No available times for this date</option>";
		help.textContent = "Try another date or staff member.";
      return;
    }
	const options = avail.map(d => {
		const hh = String(d.getHours()).padStart(2, "0");
		const mm = String(d.getMinutes()).padStart(2, "0");
		const val = `${hh}:${mm}`;
		return `<option value='${val}'>${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</option>`;
	}).join("");
	timeSelect.innerHTML = `<option value='' disabled selected>Select a time</option>` + options;
	help.textContent = `${avail.length} open slot${avail.length===1?"":"s"} on this date.`;
}

// Date helpers for UI
function updateDateHelp(){
	const dateStr = document.getElementById("date").value;
	const help = document.getElementById("dateHelp");
	if (!dateStr){ help.textContent = ""; return; }
	const d = new Date(`${dateStr}T00:00`);
	const weekday = d.toLocaleDateString([], { weekday: 'long' });
	help.textContent = `${weekday}, ${d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function shiftDate(days){
	const input = document.getElementById("date");
	const d = input.value ? new Date(`${input.value}T00:00`) : new Date();
	d.setDate(d.getDate() + days);
	const iso = d.toISOString().slice(0,10);
	input.value = iso;
	updateDateHelp();
	refreshTimeOptions();
}

function setupDateControls(){
	document.getElementById("prevDay").addEventListener("click", () => shiftDate(-1));
	document.getElementById("nextDay").addEventListener("click", () => shiftDate(1));
	document.querySelectorAll('[data-quick]').forEach(btn => {
		btn.addEventListener("click", () => {
			const kind = btn.getAttribute('data-quick');
			const d = new Date(); d.setHours(0,0,0,0);
			if (kind === 'tomorrow') d.setDate(d.getDate() + 1);
			if (kind === 'next_week') d.setDate(d.getDate() + 7);
			// If weekend, move to Monday
			while (isWeekend(d)) d.setDate(d.getDate() + 1);
			document.getElementById('date').value = d.toISOString().slice(0,10);
			updateDateHelp();
			refreshTimeOptions();
		});
	});
}

function setupAppointmentsModal(){
	const openBtn = document.getElementById("openAppointments");
	const dialog = document.getElementById("appointmentsDialog");
	const closeBtn = document.getElementById("closeAppointments");
	if (openBtn){
		openBtn.addEventListener("click", () => { renderAppointments(); openDialog(dialog); });
	}
	if (closeBtn){
		closeBtn.addEventListener("click", () => closeDialog(dialog));
	}
}

function setupBookingModal(){
	const openBtn = document.getElementById("openBooking");
	const dialog = document.getElementById("bookingDialog");
	const closeBtn = document.getElementById("closeBooking");
	if (openBtn){
		openBtn.addEventListener("click", () => {
		// refresh state each time
		const today = new Date();
		document.getElementById("date").value = today.toISOString().slice(0,10);
		updateDateHelp();
		refreshTimeOptions();
		openDialog(dialog);
		});
	}
	if (closeBtn){
		closeBtn.addEventListener("click", () => closeDialog(dialog));
	}
}

// Init
function init(){
	// Detect which page we're on by checking for key elements
	if (document.getElementById("counselorList")){
		// index page
		renderDirectory();
		handleSearch();
	}
	if (document.getElementById("bookingForm")){
		// booking page
		populateSelect();
		handleForm();
		handleUrgent();
		handleClearAll();
		// Set min date to today
		const today = new Date();
		const iso = today.toISOString().slice(0,10);
		document.getElementById("date").setAttribute("min", iso);
		// Listeners to refresh time options
		document.getElementById("counselorSelect").addEventListener("change", refreshTimeOptions);
		document.getElementById("date").addEventListener("change", () => { updateDateHelp(); refreshTimeOptions(); });
		refreshTimeOptions();
		updateDateHelp();
		setupDateControls();
	}
	if (document.getElementById("appointmentsList") && !document.getElementById("bookingForm")){
		// appointments page
		renderAppointments();
	}
}

document.addEventListener("DOMContentLoaded", init);

// Dialog helpers with fallback
function openDialog(dialog){
	if (!dialog) return;
	try{ dialog.showModal ? dialog.showModal() : dialog.show(); }
	catch{
		// Fallback for older browsers: emulate modal
		dialog.setAttribute('open','');
		dialog.style.display = 'block';
	}
}
function closeDialog(dialog){
	if (!dialog) return;
	try{ dialog.close(); }
	catch{
		dialog.removeAttribute('open');
		dialog.style.display = 'none';
	}
}


