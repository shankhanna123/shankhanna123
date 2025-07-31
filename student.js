// Firebase config is initialized in HTML

const db = firebase.database();

const enrollmentInput = document.getElementById('enrollment-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');
const attendanceSection = document.getElementById('attendance-section');
const attendanceCodeDisplay = document.getElementById('attendance-code-display');
const attendanceTimer = document.getElementById('attendance-timer');
const attendanceCodeInput = document.getElementById('attendance-code-input');
const submitAttendanceBtn = document.getElementById('submit-attendance-btn');
const attendanceMessage = document.getElementById('attendance-message');
const attendanceSuccess = document.getElementById('attendance-success');

let loggedInStudent = null; // {enrollment, password, subject}
let attendanceCodeData = null; // {code, expiry}
let attendanceTimerInterval = null;
let attendanceMarked = false;

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// Student login logic (existing logic preserved)
loginBtn.onclick = async function () {
  loginMessage.textContent = '';
  attendanceMessage.textContent = '';
  attendanceSuccess.textContent = '';
  attendanceSection.style.display = 'none';

  const enrollment = enrollmentInput.value.trim();
  const password = passwordInput.value.trim();

  if (!enrollment || !password) {
    loginMessage.textContent = "Please enter enrollment number and password.";
    return;
  }

  // Look up student in /students/{enrollment}
  const studentSnap = await db.ref('students/' + enrollment).once('value');
  const student = studentSnap.val();

  if (!student) {
    loginMessage.textContent = "Student not found.";
    return;
  }

  if (student.password !== password) {
    loginMessage.textContent = "Incorrect password.";
    return;
  }

  // Save student info for attendance logic
  loggedInStudent = {
    enrollment,
    password,
    subject: student.subject,
    name: student.name
  };

  loginMessage.textContent = '';
  attendanceSection.style.display = 'block';

  // Start listening for attendance code for student's subject
  listenForAttendanceCode(student.subject);
};

// Listen for attendance code for this subject and sync timer
function listenForAttendanceCode(subjectKey) {
  if (!subjectKey) return;
  if (attendanceTimerInterval) clearInterval(attendanceTimerInterval);
  attendanceCodeDisplay.textContent = '';
  attendanceTimer.textContent = '';
  attendanceCodeInput.value = '';
  attendanceMessage.textContent = '';
  attendanceSuccess.textContent = '';
  attendanceMarked = false;

  db.ref(`subjects/${subjectKey}/attendanceCode`).off(); // Remove previous listener
  db.ref(`subjects/${subjectKey}/attendanceCode`).on('value', (snapshot) => {
    const val = snapshot.val();
    if (val && val.code && val.expiry) {
      attendanceCodeData = val;
      showAttendanceTimer(val.code, val.expiry);
    } else {
      attendanceCodeData = null;
      attendanceCodeDisplay.textContent = '';
      attendanceTimer.textContent = '';
      if (attendanceTimerInterval) clearInterval(attendanceTimerInterval);
    }
  });
}

function showAttendanceTimer(code, expiry) {
  if (attendanceTimerInterval) clearInterval(attendanceTimerInterval);
  attendanceMarked = false;
  attendanceSuccess.textContent = "";
  attendanceMessage.textContent = "";
  attendanceCodeInput.value = "";
  attendanceCodeInput.disabled = false;
  submitAttendanceBtn.disabled = false;

  const update = () => {
    const now = Date.now();
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    attendanceCodeDisplay.textContent = `Attendance Code: ${code}`;
    attendanceTimer.textContent = remaining > 0
      ? `Time left: ${remaining}s`
      : `Time's up!`;
    if (remaining <= 0) {
      clearInterval(attendanceTimerInterval);
      attendanceCodeInput.disabled = true;
      submitAttendanceBtn.disabled = true;
      if (!attendanceMarked) {
        attendanceMessage.textContent = "Attendance window closed. You are marked absent.";
      }
    }
  };
  update();
  attendanceTimerInterval = setInterval(update, 1000);
}

// Attendance code submission logic
submitAttendanceBtn.onclick = async function () {
  attendanceMessage.textContent = "";
  attendanceSuccess.textContent = "";

  if (!attendanceCodeData || !loggedInStudent) {
    attendanceMessage.textContent = "No active attendance code.";
    return;
  }
  if (attendanceMarked) {
    attendanceMessage.textContent = "Attendance already marked.";
    return;
  }

  const codeInput = attendanceCodeInput.value.trim();
  if (!codeInput) {
    attendanceMessage.textContent = "Please enter the attendance code.";
    return;
  }

  const now = Date.now();
  if (now > attendanceCodeData.expiry) {
    attendanceMessage.textContent = "Attendance window closed. You are marked absent.";
    attendanceCodeInput.disabled = true;
    submitAttendanceBtn.disabled = true;
    return;
  }

  if (codeInput !== attendanceCodeData.code) {
    attendanceMessage.textContent = "Invalid code";
    return;
  }

  // Mark attendance as present for this student, subject, date
  db.ref(`attendance/${loggedInStudent.subject}/${getTodayDate()}/${loggedInStudent.enrollment}`).set({
    status: "present"
  }, function (err) {
    if (!err) {
      attendanceSuccess.textContent = "Attendance marked as present!";
      attendanceMarked = true;
      attendanceCodeInput.disabled = true;
      submitAttendanceBtn.disabled = true;
    } else {
      attendanceMessage.textContent = "Error marking attendance. Try again.";
    }
  });
};
