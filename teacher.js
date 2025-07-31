// Initialize Firebase (already done in HTML)
// firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const subjectsContainer = document.getElementById('subjects-container');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectNameInput = document.getElementById('subject-name');

// Utility: Generate random 6-char password
function generatePassword() {
  return Math.random().toString(36).slice(-6);
}

// Utility: Generate random 6-digit attendance code
function generateAttendanceCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Load subjects and render them
function loadSubjects() {
  subjectsContainer.innerHTML = "";
  db.ref('subjects').once('value', (snapshot) => {
    const subjects = snapshot.val() || {};
    Object.keys(subjects).forEach((subjectKey) => {
      renderSubject(subjectKey, subjects[subjectKey]);
    });
  });
}

// Render a single subject section
function renderSubject(subjectKey, subjectData) {
  const section = document.createElement('div');
  section.className = 'section subject-section';
  section.innerHTML = `
    <h3>${subjectData.name}</h3>
    <button class="small-btn add-student-btn">Add Student</button>
    <button class="small-btn generate-code-btn">Generate Code</button>
    <span class="attendance-code-timer"></span>
    <div class="attendance-code-display"></div>
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
        // Also save student for login lookup (optional: global student list)
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
    // Generate a random 6-digit code
    const code = generateAttendanceCode();
    // 1 minute expiry
    const expiry = Date.now() + 60 * 1000;

    // Mark all students as absent for this round
    const studentsSnap = await db.ref(`subjects/${subjectKey}/students`).once('value');
    const students = studentsSnap.val() || {};
    Object.keys(students).forEach(enroll => {
      db.ref(`attendance/${subjectKey}/${getTodayDate()}/${enroll}`).set({ status: "absent" });
    });

    // Save code and expiry in Firebase
    db.ref(`subjects/${subjectKey}/attendanceCode`).set({
      code: code,
      expiry: expiry
    });
    // Timer and code will sync via listener below
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

  // Listen for code changes (teacher and student screens sync)
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
}

// Get today's date as YYYY-MM-DD
function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// Clear student form input fields
function clearStudentForm(form) {
  form.querySelector('.enroll-input').value = '';
  form.querySelector('.name-input').value = '';
  form.querySelector('.class-input').value = '';
  form.querySelector('.gender-input').value = '';
  form.querySelector('.cast-input').value = '';
  form.querySelector('.student-form-message').textContent = '';
}

// Load students for a subject and render in table
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
  // Create a unique key for the subject
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

// Initial load
loadSubjects();
