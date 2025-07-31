// Initialize Firebase (already done in HTML)
// firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const subjectsContainer = document.getElementById('subjects-container');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectNameInput = document.getElementById('subject-name');

function generatePassword() {
  return Math.random().toString(36).slice(-6);
}

function generateAttendanceCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function loadSubjects() {
  subjectsContainer.innerHTML = "";
  db.ref('subjects').once('value', (snapshot) => {
    const subjects = snapshot.val() || {};
    Object.keys(subjects).forEach((subjectKey) => {
      renderSubject(subjectKey, subjects[subjectKey]);
    });
  });
}

function renderSubject(subjectKey, subjectData) {
  const section = document.createElement('div');
  section.className = 'section subject-section';
  section.innerHTML = `
    <h3>${subjectData.name}</h3>
    <button class="small-btn add-student-btn">Add Student</button>
    <button class="small-btn generate-code-btn">Generate Code</button>
    <span class="attendance-code-timer"></span>
    <div class="attendance-code-display"></div>
    <div class="export-attendance-wrapper" title="Export Attendance">
      <button class="export-attendance-btn">Export Attendance</button>
      <div class="export-dropdown">
        <button class="export-pdf-btn">Export as PDF</button>
        <button class="export-excel-btn">Export as Excel</button>
      </div>
    </div>
    <div class="student-form">
      <h4>Add Student to ${subjectData.name}</h4>
      <input type="text" class="enroll-input" placeholder="Enrollment Number" required />
      <input type="text" class="name-input" placeholder="Name" required />
      <input type="text" class="class-input" placeholder="Class" required />
      <select class="gender-input">
        <option value="">Select Gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
      <input type="text" class="cast-input" placeholder="Cast (optional)" />
      <button class="submit-student-btn">Add</button>
      <button class="close-btn">Cancel</button>
      <div class="student-form-message" style="margin-top:10px; color:green;"></div>
    </div>
    <div class="student-list">
      <h4>Students</h4>
      <table class="student-list-table">
        <thead>
          <tr>
            <th>Enrollment No.</th>
            <th>Name</th>
            <th>Class</th>
            <th>Gender</th>
            <th>Cast</th>
            <th>Password</th>
          </tr>
        </thead>
        <tbody class="student-list-body"></tbody>
      </table>
    </div>
  `;
  subjectsContainer.appendChild(section);

  // Show/hide student form
  const addStudentBtn = section.querySelector('.add-student-btn');
  const studentForm = section.querySelector('.student-form');
  addStudentBtn.onclick = () => { studentForm.style.display = 'block'; };
  section.querySelector('.close-btn').onclick = () => {
    studentForm.style.display = 'none';
    clearStudentForm(studentForm);
  };

  // Add student logic
  section.querySelector('.submit-student-btn').onclick = async function () {
    const enroll = studentForm.querySelector('.enroll-input').value.trim();
    const name = studentForm.querySelector('.name-input').value.trim();
    const className = studentForm.querySelector('.class-input').value.trim();
    const gender = studentForm.querySelector('.gender-input').value;
    const cast = studentForm.querySelector('.cast-input').value.trim();

    if (!enroll || !name || !className || !gender) {
      studentForm.querySelector('.student-form-message').textContent = 'Please fill in all required fields.';
      return;
    }

    // Check if enrollment already exists for this subject
    const studentRef = db.ref(`subjects/${subjectKey}/students/${enroll}`);
    const studentSnap = await studentRef.once('value');
    if (studentSnap.exists()) {
      studentForm.querySelector('.student-form-message').textContent = 'Student with this enrollment number already exists.';
      return;
    }

    const password = generatePassword();

    // Save student under the subject
    studentRef.set({
      name,
      class: className,
      gender,
      cast: cast || '',
      password
    }, (error) => {
      if (error) {
        studentForm.querySelector('.student-form-message').textContent = 'Error adding student.';
      } else {
        db.ref(`students/${enroll}`).set({
          name,
          class: className,
          gender,
          cast: cast || '',
          password,
          subject: subjectKey
        });
        studentForm.querySelector('.student-form-message').textContent = `Student added! Generated password: ${password}`;
        loadStudents(section, subjectKey);
        setTimeout(() => {
          studentForm.style.display = 'none';
          clearStudentForm(studentForm);
        }, 2000);
      }
    });
  };

  // Load students for this subject
  loadStudents(section, subjectKey);

  // --- Attendance Code Logic ---
  const generateCodeBtn = section.querySelector('.generate-code-btn');
  const codeDisplay = section.querySelector('.attendance-code-display');
  const timerDisplay = section.querySelector('.attendance-code-timer');
  let timerInterval = null;

  generateCodeBtn.onclick = async function () {
    const code = generateAttendanceCode();
    const expiry = Date.now() + 60 * 1000;

    const studentsSnap = await db.ref(`subjects/${subjectKey}/students`).once('value');
    const students = studentsSnap.val() || {};
    Object.keys(students).forEach(enroll => {
      db.ref(`attendance/${subjectKey}/${getTodayDate()}/${enroll}`).set({ status: "absent" });
    });

    db.ref(`subjects/${subjectKey}/attendanceCode`).set({
      code: code,
      expiry: expiry
    });
  };

  function startAttendanceTimer(code, expiry) {
    if (timerInterval) clearInterval(timerInterval);
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      codeDisplay.textContent = `Attendance Code: ${code}`;
      timerDisplay.textContent = remaining > 0
        ? `Time left: ${remaining}s`
        : `Time's up!`;
      if (remaining <= 0) {
        clearInterval(timerInterval);
        setTimeout(() => {
          codeDisplay.textContent = "";
          timerDisplay.textContent = "";
        }, 2500);
      }
    };
    update();
    timerInterval = setInterval(update, 1000);
  }

  db.ref(`subjects/${subjectKey}/attendanceCode`).on('value', function(snapshot) {
    const val = snapshot.val();
    if (val && val.code && val.expiry) {
      startAttendanceTimer(val.code, val.expiry);
    } else {
      codeDisplay.textContent = "";
      timerDisplay.textContent = "";
      if (timerInterval) clearInterval(timerInterval);
    }
  });

  // ---- Export Attendance Logic ----
  // Export PDF and Excel logic (using jsPDF and SheetJS)
  const exportAttendanceBtn = section.querySelector('.export-attendance-btn');
  const exportPdfBtn = section.querySelector('.export-pdf-btn');
  const exportExcelBtn = section.querySelector('.export-excel-btn');

  exportPdfBtn.onclick = function (e) {
    e.preventDefault();
    exportAttendanceData(subjectKey, subjectData.name, 'pdf');
  };
  exportExcelBtn.onclick = function (e) {
    e.preventDefault();
    exportAttendanceData(subjectKey, subjectData.name, 'excel');
  };
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function clearStudentForm(form) {
  form.querySelector('.enroll-input').value = '';
  form.querySelector('.name-input').value = '';
  form.querySelector('.class-input').value = '';
  form.querySelector('.gender-input').value = '';
  form.querySelector('.cast-input').value = '';
  form.querySelector('.student-form-message').textContent = '';
}

function loadStudents(section, subjectKey) {
  const studentListBody = section.querySelector('.student-list-body');
  studentListBody.innerHTML = '';
  db.ref(`subjects/${subjectKey}/students`).once('value', (snapshot) => {
    const students = snapshot.val() || {};
    Object.keys(students).forEach((enroll) => {
      const s = students[enroll];
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${enroll}</td>
        <td>${s.name}</td>
        <td>${s.class}</td>
        <td>${s.gender}</td>
        <td>${s.cast || ''}</td>
        <td>${s.password}</td>
      `;
      studentListBody.appendChild(row);
    });
  });
}

// Add subject logic
addSubjectBtn.onclick = function () {
  const name = subjectNameInput.value.trim();
  if (!name) return;
  const subjectKey = name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
  db.ref('subjects/' + subjectKey).set({
    name
  }, (error) => {
    if (!error) {
      subjectNameInput.value = '';
      loadSubjects();
    }
  });
};

function exportAttendanceData(subjectKey, subjectName, type) {
  // 1. Get all students
  db.ref(`subjects/${subjectKey}/students`).once('value', stuSnap => {
    const students = stuSnap.val() || {};
    // 2. Get all attendance dates for this subject
    db.ref(`attendance/${subjectKey}`).once('value', attSnap => {
      const attData = attSnap.val() || {};
      // Collect all dates
      const dates = Object.keys(attData);
      // Build header row
      const headerRow = ["Enrollment No.", "Name", ...dates];
      // Build data rows
      const rows = [];
      Object.keys(students).forEach(enroll => {
        const s = students[enroll];
        const row = [
          enroll,
          s.name,
          ...dates.map(date =>
            (attData[date] && attData[date][enroll] && attData[date][enroll].status)
              ? attData[date][enroll].status : "absent"
          )
        ];
        rows.push(row);
      });

      // Export logic
      if (type === "pdf") {
        exportAttendanceToPDF(subjectName, headerRow, rows);
      } else if (type === "excel") {
        exportAttendanceToExcel(subjectName, headerRow, rows);
      }
    });
  });
}

function exportAttendanceToPDF(subjectName, headerRow, rows) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt'
  });
  doc.setFontSize(16);
  doc.text(`Attendance Report: ${subjectName}`, 40, 40);

  // Table
  let startY = 70;
  const cellPadding = 8;
  const colWidths = Array(headerRow.length).fill(110);
  let y = startY;

  // Draw header
  let x = 40;
  doc.setFont(undefined, 'bold');
  headerRow.forEach((header, i) => {
    doc.text(header, x, y);
    x += colWidths[i];
  });
  doc.setFont(undefined, 'normal');
  y += 22;

  // Draw rows
  rows.forEach(row => {
    x = 40;
    row.forEach((cell, i) => {
      doc.text(String(cell), x, y);
      x += colWidths[i];
    });
    y += 18;
    if (y > 540) { // Page break
      doc.addPage();
      y = 40;
    }
  });

  doc.save(`${subjectName.replace(/\s+/g, '_')}_Attendance.pdf`);
}

function exportAttendanceToExcel(subjectName, headerRow, rows) {
  // Prepare worksheet data
  const ws_data = [headerRow, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Attendance");
  XLSX.writeFile(wb, `${subjectName.replace(/\s+/g, '_')}_Attendance.xlsx`);
}

// Initial load
loadSubjects();
