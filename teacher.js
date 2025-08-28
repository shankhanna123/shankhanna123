// Initialize Firebase (already done in HTML)
// firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const subjectsContainer = document.getElementById('subjects-container');
const addSubjectBtn = document.getElementById('add-subject-btn');
const subjectNameInput = document.getElementById('subject-name');

// Enhanced utility functions
function generatePassword() {
  return Math.random().toString(36).slice(-6);
}

function generateAttendanceCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getTodayDate() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

// Enhanced toast notification system
function showToast(message, type = 'info') {
  // Check if enhanced UI toast exists, otherwise use alert
  const toast = document.getElementById('toast');
  if (toast && typeof showToast !== 'undefined') {
    // Use enhanced UI toast
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  } else {
    // Fallback to console and alert for critical messages
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === 'error') {
      alert(`Error: ${message}`);
    }
  }
}

// Enhanced loading state management
function setLoadingState(element, isLoading, originalText) {
  if (isLoading) {
    element.disabled = true;
    element.dataset.originalText = originalText || element.textContent;
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.classList.add('loading');
  } else {
    element.disabled = false;
    element.textContent = element.dataset.originalText || originalText;
    element.classList.remove('loading');
  }
}

function loadSubjects() {
  console.log('🔄 Loading subjects from Firebase...');
  subjectsContainer.innerHTML = '<div style="text-align: center; padding: 20px;">Loading subjects...</div>';
  
  db.ref('subjects').once('value')
    .then((snapshot) => {
      const subjects = snapshot.val() || {};
      const subjectKeys = Object.keys(subjects);
      
      console.log(`📚 Found ${subjectKeys.length} subjects:`, subjectKeys);
      
      subjectsContainer.innerHTML = '';
      
      if (subjectKeys.length === 0) {
        subjectsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No subjects found. Add your first subject above!</div>';
        return;
      }
      
      subjectKeys.forEach((subjectKey) => {
        renderSubject(subjectKey, subjects[subjectKey]);
      });
      
      showToast(`✅ Loaded ${subjectKeys.length} subjects successfully`, 'success');
    })
    .catch((error) => {
      console.error('❌ Error loading subjects:', error);
      subjectsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: red;">Error loading subjects. Please refresh the page.</div>';
      showToast('Failed to load subjects', 'error');
    });
}

function renderSubject(subjectKey, subjectData) {
  const section = document.createElement('div');
  section.className = 'section subject-section fade-in';
  section.innerHTML = `
    <div class="section-header">
      <div class="section-title">
        <div class="section-icon">
          <i class="fas fa-book"></i>
        </div>
        <h3>${subjectData.name}</h3>
      </div>
      <div class="subject-actions">
        <button class="btn btn-secondary add-student-btn">
          <i class="fas fa-user-plus"></i> Add Student
        </button>
        <button class="btn btn-success generate-code-btn">
          <i class="fas fa-qrcode"></i> Generate Code
        </button>
      </div>
    </div>
    
    <div class="attendance-section">
      <div class="attendance-code-display" style="display: none;"></div>
      <div class="attendance-code-timer"></div>
    </div>
    
    <div class="export-section" style="margin: 20px 0;">
      <div class="export-attendance-wrapper">
        <button class="btn btn-primary export-attendance-btn">
          <i class="fas fa-download"></i> Export Attendance
        </button>
        <div class="export-dropdown" style="display: none; margin-top: 10px; gap: 10px;">
          <button class="btn btn-warning export-pdf-btn">
            <i class="fas fa-file-pdf"></i> Export as PDF
          </button>
          <button class="btn btn-info export-excel-btn">
            <i class="fas fa-file-excel"></i> Export as Excel
          </button>
        </div>
      </div>
    </div>
    
    <div class="student-form" style="display: none;">
      <div class="section-header">
        <h4>Add Student to ${subjectData.name}</h4>
      </div>
      <div class="form-group">
        <div class="input-container">
          <label class="input-label">Enrollment Number *</label>
          <input type="text" class="enroll-input" placeholder="Enter enrollment number" required />
        </div>
        <div class="input-container">
          <label class="input-label">Student Name *</label>
          <input type="text" class="name-input" placeholder="Enter full name" required />
        </div>
      </div>
      <div class="form-group">
        <div class="input-container">
          <label class="input-label">Class *</label>
          <input type="text" class="class-input" placeholder="Enter class" required />
        </div>
        <div class="input-container">
          <label class="input-label">Gender *</label>
          <select class="gender-input">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <div class="input-container">
          <label class="input-label">Cast (Optional)</label>
          <input type="text" class="cast-input" placeholder="Enter cast (optional)" />
        </div>
      </div>
      <div class="form-actions" style="margin-top: 20px;">
        <button class="btn btn-success submit-student-btn">
          <i class="fas fa-plus"></i> Add Student
        </button>
        <button class="btn btn-secondary close-btn">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
      <div class="student-form-message" style="margin-top: 15px; padding: 10px; border-radius: 8px;"></div>
    </div>
    
    <div class="student-list">
      <div class="section-header">
        <h4><i class="fas fa-users"></i> Students (Loading...)</h4>
        <button class="btn btn-secondary refresh-students-btn">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>
      <div class="table-container">
        <table class="student-list-table">
          <thead>
            <tr>
              <th><i class="fas fa-id-card"></i> Enrollment No.</th>
              <th><i class="fas fa-user"></i> Name</th>
              <th><i class="fas fa-school"></i> Class</th>
              <th><i class="fas fa-venus-mars"></i> Gender</th>
              <th><i class="fas fa-users"></i> Cast</th>
              <th><i class="fas fa-key"></i> Password</th>
              <th><i class="fas fa-cogs"></i> Actions</th>
            </tr>
          </thead>
          <tbody class="student-list-body">
            <tr><td colspan="7" style="text-align: center; padding: 20px;">Loading students...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  subjectsContainer.appendChild(section);

  // Enhanced form handling
  setupFormHandlers(section, subjectKey, subjectData);
  
  // Enhanced attendance code logic
  setupAttendanceCodeLogic(section, subjectKey);
  
  // Enhanced export logic
  setupExportLogic(section, subjectKey, subjectData.name);
  
  // Load students for this subject
  loadStudents(section, subjectKey);
}

function setupFormHandlers(section, subjectKey, subjectData) {
  const addStudentBtn = section.querySelector('.add-student-btn');
  const studentForm = section.querySelector('.student-form');
  const closeBtn = section.querySelector('.close-btn');
  const submitBtn = section.querySelector('.submit-student-btn');
  
  // Show form
  addStudentBtn.onclick = () => {
    studentForm.style.display = 'block';
    studentForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  
  // Hide form
  closeBtn.onclick = () => {
    studentForm.style.display = 'none';
    clearStudentForm(studentForm);
  };
  
  // Enhanced submit logic with comprehensive validation
  submitBtn.onclick = async function () {
    const enroll = studentForm.querySelector('.enroll-input').value.trim();
    const name = studentForm.querySelector('.name-input').value.trim();
    const className = studentForm.querySelector('.class-input').value.trim();
    const gender = studentForm.querySelector('.gender-input').value;
    const cast = studentForm.querySelector('.cast-input').value.trim();
    const messageDiv = studentForm.querySelector('.student-form-message');
    
    // Clear previous messages
    messageDiv.textContent = '';
    messageDiv.className = 'student-form-message';
    
    // Enhanced validation
    if (!enroll || !name || !className || !gender) {
      messageDiv.textContent = '❌ Please fill in all required fields (marked with *)';
      messageDiv.style.color = 'red';
      return;
    }
    
    // Validate enrollment number format
    if (!/^[A-Za-z0-9]+$/.test(enroll)) {
      messageDiv.textContent = '❌ Enrollment number should contain only letters and numbers';
      messageDiv.style.color = 'red';
      return;
    }
    
    setLoadingState(submitBtn, true, 'Add Student');
    
    try {
      // Check if enrollment already exists for this subject
      const studentRef = db.ref(`subjects/${subjectKey}/students/${enroll}`);
      const studentSnap = await studentRef.once('value');
      
      if (studentSnap.exists()) {
        messageDiv.textContent = '⚠️ Student with this enrollment number already exists in this subject.';
        messageDiv.style.color = 'orange';
        setLoadingState(submitBtn, false);
        return;
      }
      
      // Check if enrollment exists globally
      const globalStudentSnap = await db.ref(`students/${enroll}`).once('value');
      if (globalStudentSnap.exists()) {
        messageDiv.textContent = '⚠️ This enrollment number is already registered in the system.';
        messageDiv.style.color = 'orange';
        setLoadingState(submitBtn, false);
        return;
      }
      
      const password = generatePassword();
      
      console.log(`👤 Adding student ${name} (${enroll}) to subject ${subjectKey}`);
      
      // Save student under the subject
      await studentRef.set({
        name,
        class: className,
        gender,
        cast: cast || '',
        password,
        addedDate: new Date().toISOString(),
        addedBy: firebase.auth().currentUser?.uid || 'unknown'
      });
      
      // Also save to global students registry
      await db.ref(`students/${enroll}`).set({
        name,
        class: className,
        gender,
        cast: cast || '',
        password,
        subject: subjectKey,
        subjectName: subjectData.name,
        addedDate: new Date().toISOString()
      });
      
      messageDiv.innerHTML = `✅ Student added successfully!<br><strong>Generated password: ${password}</strong><br><small>Please share this password with the student.</small>`;
      messageDiv.style.color = 'green';
      
      showToast(`✅ Student ${name} added successfully`, 'success');
      
      // Refresh student list
      loadStudents(section, subjectKey);
      
      // Auto-hide form after success
      setTimeout(() => {
        studentForm.style.display = 'none';
        clearStudentForm(studentForm);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error adding student:', error);
      messageDiv.textContent = `❌ Error adding student: ${error.message}`;
      messageDiv.style.color = 'red';
      showToast('Failed to add student', 'error');
    } finally {
      setLoadingState(submitBtn, false);
    }
  };
  
  // Add refresh button handler
  const refreshBtn = section.querySelector('.refresh-students-btn');
  refreshBtn.onclick = () => {
    loadStudents(section, subjectKey);
    showToast('🔄 Refreshing student list...', 'info');
  };
}

function setupAttendanceCodeLogic(section, subjectKey) {
  const generateCodeBtn = section.querySelector('.generate-code-btn');
  const codeDisplay = section.querySelector('.attendance-code-display');
  const timerDisplay = section.querySelector('.attendance-code-timer');
  let timerInterval = null;

  generateCodeBtn.onclick = async function () {
    try {
      setLoadingState(generateCodeBtn, true, 'Generate Code');
      
      const code = generateAttendanceCode();
      const expiry = Date.now() + 60 * 1000; // 1 minute
      const todayDate = getTodayDate();
      
      console.log(`🎯 Generating attendance code ${code} for subject ${subjectKey} on ${todayDate}`);
      
      // Get all students for this subject
      const studentsSnap = await db.ref(`subjects/${subjectKey}/students`).once('value');
      const students = studentsSnap.val() || {};
      const studentCount = Object.keys(students).length;
      

      
      console.log(studentCount === 0 
        ? `👥 No students in subject - attendance code generated for future use` 
        : `👥 Setting initial absent status for ${studentCount} students`);
      
      // Initialize all students as absent for today
      const attendanceUpdates = {};
      Object.keys(students).forEach(enroll => {
        attendanceUpdates[`attendance/${subjectKey}/${todayDate}/${enroll}`] = { 
          status: "absent",
          timestamp: Date.now(),
          codeGenerated: code
        };
      });
      
      // Set attendance code
      attendanceUpdates[`subjects/${subjectKey}/attendanceCode`] = {
        code: code,
        expiry: expiry,
        generated: Date.now(),
        date: todayDate
      };
      
      // Apply all updates atomically
      await db.ref().update(attendanceUpdates);
      
      showToast(studentCount === 0 
        ? '✅ Attendance code generated! Ready for students to join.' 
        : `✅ Attendance code generated! ${studentCount} students marked as absent initially.`, 'success');
      console.log(`✅ Attendance code ${code} generated successfully for ${studentCount} students`);
      
    } catch (error) {
      console.error('❌ Error generating attendance code:', error);
      showToast('Failed to generate attendance code', 'error');
    } finally {
      setLoadingState(generateCodeBtn, false);
    }
  };

  function startAttendanceTimer(code, expiry, date) {
    if (timerInterval) clearInterval(timerInterval);
    
    codeDisplay.style.display = 'block';
    codeDisplay.innerHTML = `
      <div class="code-value">${code}</div>
      <div class="code-info">
        <div>📅 Date: ${date}</div>
        <div class="code-timer">⏰ Time remaining: <span id="timer-countdown">60</span>s</div>
      </div>
      <button class="copy-btn" onclick="copyToClipboard('${code}', this)">
        <i class="fas fa-copy"></i> Copy Code
      </button>
    `;
    
    const update = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      
      const countdownElement = document.getElementById('timer-countdown');
      if (countdownElement) {
        countdownElement.textContent = remaining;
      }
      
      if (remaining <= 0) {
        clearInterval(timerInterval);
        timerDisplay.innerHTML = '<div style="color: red; font-weight: bold;">⏰ Attendance time expired!</div>';
        
        setTimeout(() => {
          codeDisplay.style.display = 'none';
          timerDisplay.textContent = "";
          // Clean up expired code from database
          db.ref(`subjects/${subjectKey}/attendanceCode`).remove();
        }, 3000);
      }
    };
    
    update();
    timerInterval = setInterval(update, 1000);
  }

  // Listen for attendance code changes
  db.ref(`subjects/${subjectKey}/attendanceCode`).on('value', function(snapshot) {
    const val = snapshot.val();
    if (val && val.code && val.expiry && val.expiry > Date.now()) {
      console.log(`📟 Active attendance code detected: ${val.code}`);
      startAttendanceTimer(val.code, val.expiry, val.date || getTodayDate());
    } else {
      codeDisplay.style.display = 'none';
      timerDisplay.textContent = "";
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  });
}

function setupExportLogic(section, subjectKey, subjectName) {
  const exportAttendanceBtn = section.querySelector('.export-attendance-btn');
  const exportDropdown = section.querySelector('.export-dropdown');
  const exportPdfBtn = section.querySelector('.export-pdf-btn');
  const exportExcelBtn = section.querySelector('.export-excel-btn');

  // Toggle dropdown
  exportAttendanceBtn.onclick = function(e) {
    e.preventDefault();
    const isVisible = exportDropdown.style.display === 'flex';
    exportDropdown.style.display = isVisible ? 'none' : 'flex';
  };

  // Export handlers with comprehensive error handling
  exportPdfBtn.onclick = function (e) {
    e.preventDefault();
    exportDropdown.style.display = 'none';
    exportAttendanceData(subjectKey, subjectName, 'pdf', exportPdfBtn);
  };

  exportExcelBtn.onclick = function (e) {
    e.preventDefault();
    exportDropdown.style.display = 'none';
    exportAttendanceData(subjectKey, subjectName, 'excel', exportExcelBtn);
  };
}

// **COMPLETELY FIXED EXPORT FUNCTION** 🔧
async function exportAttendanceData(subjectKey, subjectName, type, buttonElement) {
  console.log(`📊 Starting export for subject: ${subjectName} (${subjectKey}) as ${type.toUpperCase()}`);
  
  try {
    // Set loading state
    setLoadingState(buttonElement, true, `Export as ${type.toUpperCase()}`);
    showToast(`🔄 Preparing ${type.toUpperCase()} export for ${subjectName}...`, 'info');
    
    // Step 1: Get all students
    console.log('📖 Step 1: Fetching students...');
    const studentsSnapshot = await db.ref(`subjects/${subjectKey}/students`).once('value');
    const students = studentsSnapshot.val();
    
    if (!students || Object.keys(students).length === 0) {
      throw new Error('No students found in this subject. Please add students first.');
    }
    
    const studentsList = Object.keys(students);
    console.log(`👥 Found ${studentsList.length} students:`, studentsList);
    
    // Step 2: Get all attendance data
    console.log('📈 Step 2: Fetching attendance data...');
    const attendanceSnapshot = await db.ref(`attendance/${subjectKey}`).once('value');
    const attendanceData = attendanceSnapshot.val();
    
    console.log('📊 Raw attendance data:', attendanceData);
    
    if (!attendanceData || Object.keys(attendanceData).length === 0) {
      console.log('⚠️ No attendance records found, creating export with "No Record" entries');
      
      // Create export with "No Record" for all students
      const headerRow = ["Enrollment No.", "Name", "Class", "Gender", "Status"];
      const rows = studentsList.map(enroll => {
        const student = students[enroll];
        return [
          enroll,
          student.name || 'N/A',
          student.class || 'N/A',
          student.gender || 'N/A',
          'No attendance records found'
        ];
      });
      
      await performExport(type, subjectName, headerRow, rows);
      showToast(`✅ Export completed! Note: No attendance records found for ${subjectName}`, 'warning');
      return;
    }
    
    // Step 3: Process attendance data
    const dates = Object.keys(attendanceData).sort(); // Sort dates chronologically
    console.log(`📅 Found attendance for ${dates.length} dates:`, dates);
    
    // Step 4: Build export data
    console.log('🔨 Step 4: Building export data...');
    const headerRow = ["Enrollment No.", "Name", "Class", "Gender", ...dates, "Total Present", "Attendance %"];
    
    const rows = studentsList.map(enroll => {
      const student = students[enroll];
      const attendanceRecord = [];
      let presentCount = 0;
      let totalClasses = dates.length;
      
      // Check attendance for each date
      dates.forEach(date => {
        const dayAttendance = attendanceData[date];
        let status = 'Absent'; // Default to absent
        
        if (dayAttendance && dayAttendance[enroll]) {
          status = dayAttendance[enroll].status === 'present' ? 'Present' : 'Absent';
          if (status === 'Present') {
            presentCount++;
          }
        }
        
        attendanceRecord.push(status);
      });
      
      // Calculate attendance percentage
      const attendancePercentage = totalClasses > 0 ? 
        Math.round((presentCount / totalClasses) * 100) : 0;
      
      const row = [
        enroll,
        student.name || 'N/A',
        student.class || 'N/A', 
        student.gender || 'N/A',
        ...attendanceRecord,
        `${presentCount}/${totalClasses}`,
        `${attendancePercentage}%`
      ];
      
      console.log(`📊 Student ${enroll}: ${presentCount}/${totalClasses} (${attendancePercentage}%)`);
      return row;
    });
    
    // Step 5: Export the data
    console.log('💾 Step 5: Exporting data...');
    await performExport(type, subjectName, headerRow, rows);
    
    const totalRecords = dates.length * studentsList.length;
    showToast(`✅ ${type.toUpperCase()} export completed! ${studentsList.length} students across ${dates.length} dates (${totalRecords} total records)`, 'success');
    
    console.log(`✅ Export completed successfully for ${subjectName}`);
    
  } catch (error) {
    console.error(`❌ Export failed for ${subjectName}:`, error);
    showToast(`❌ Export failed: ${error.message}`, 'error');
  } finally {
    if (buttonElement) {
      setLoadingState(buttonElement, false);
    }
  }
}

async function performExport(type, subjectName, headerRow, rows) {
  if (type === "pdf") {
    return exportAttendanceToPDF(subjectName, headerRow, rows);
  } else if (type === "excel") {
    return exportAttendanceToExcel(subjectName, headerRow, rows);
  } else {
    throw new Error('Invalid export type. Must be "pdf" or "excel".');
  }
}

// Enhanced PDF Export with better formatting
function exportAttendanceToPDF(subjectName, headerRow, rows) {
  try {
    console.log('📄 Creating PDF export...');
    
    if (typeof window.jspdf === 'undefined') {
      throw new Error('PDF library not loaded. Please refresh the page and try again.');
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Add title and metadata
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(`Attendance Report: ${subjectName}`, 40, 40);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, 40, 65);
    doc.text(`Total Students: ${rows.length}`, 40, 80);

    // Enhanced table rendering
    let startY = 100;
    const cellPadding = 6;
    const rowHeight = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxTableWidth = pageWidth - 80; // 40pt margin on each side
    
    // Calculate column widths dynamically
    const colWidths = headerRow.map((header, index) => {
      if (index === 0) return 80; // Enrollment
      if (index === 1) return 120; // Name  
      if (index === 2) return 60; // Class
      if (index === 3) return 60; // Gender
      return Math.max(50, Math.min(80, (maxTableWidth - 320) / (headerRow.length - 4))); // Other columns
    });
    
    let currentY = startY;

    // Draw header row
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    let currentX = 40;
    
    headerRow.forEach((header, index) => {
      // Draw cell background for header
      doc.setFillColor(240, 240, 240);
      doc.rect(currentX, currentY - 15, colWidths[index], rowHeight, 'F');
      
      // Draw cell border
      doc.setDrawColor(0, 0, 0);
      doc.rect(currentX, currentY - 15, colWidths[index], rowHeight);
      
      // Add text (truncate if too long)
      let displayText = header.length > 12 ? header.substring(0, 12) + '...' : header;
      doc.text(displayText, currentX + cellPadding, currentY - 2);
      currentX += colWidths[index];
    });

    currentY += rowHeight;
    doc.setFont(undefined, 'normal');

    // Draw data rows
    rows.forEach((row, rowIndex) => {
      // Check if we need a new page
      if (currentY > 500) {
        doc.addPage();
        currentY = 40;
        
        // Redraw header on new page
        doc.setFont(undefined, 'bold');
        currentX = 40;
        headerRow.forEach((header, index) => {
          doc.setFillColor(240, 240, 240);
          doc.rect(currentX, currentY - 15, colWidths[index], rowHeight, 'F');
          doc.rect(currentX, currentY - 15, colWidths[index], rowHeight);
          let displayText = header.length > 12 ? header.substring(0, 12) + '...' : header;
          doc.text(displayText, currentX + cellPadding, currentY - 2);
          currentX += colWidths[index];
        });
        currentY += rowHeight;
        doc.setFont(undefined, 'normal');
      }

      currentX = 40;
      
      row.forEach((cell, cellIndex) => {
        // Alternate row colors
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(currentX, currentY - 15, colWidths[cellIndex], rowHeight, 'F');
        }
        
        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.rect(currentX, currentY - 15, colWidths[cellIndex], rowHeight);
        
        // Add text with color coding for attendance
        let displayText = String(cell);
        if (displayText.length > 15) {
          displayText = displayText.substring(0, 15) + '...';
        }
        
        // Color code attendance status
        if (displayText === 'Present') {
          doc.setTextColor(0, 128, 0); // Green for present
        } else if (displayText === 'Absent') {
          doc.setTextColor(255, 0, 0); // Red for absent
        } else {
          doc.setTextColor(0, 0, 0); // Black for other text
        }
        
        doc.text(displayText, currentX + cellPadding, currentY - 2);
        currentX += colWidths[cellIndex];
      });

      currentY += rowHeight;
      doc.setTextColor(0, 0, 0); // Reset text color
    });

    // Add footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount} | Generated by Attendance System`, 40, doc.internal.pageSize.getHeight() - 20);
    }

    // Save the PDF
    const filename = `${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance_${getTodayDate()}.pdf`;
    doc.save(filename);
    
    console.log(`✅ PDF saved as: ${filename}`);
    
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    throw new Error(`PDF export failed: ${error.message}`);
  }
}

// Enhanced Excel Export with better formatting
function exportAttendanceToExcel(subjectName, headerRow, rows) {
  try {
    console.log('📊 Creating Excel export...');
    
    if (typeof XLSX === 'undefined') {
      throw new Error('Excel library not loaded. Please refresh the page and try again.');
    }

    // Prepare worksheet data with metadata
    const metadataRows = [
      [`Attendance Report: ${subjectName}`],
      [`Generated on: ${new Date().toLocaleString()}`],
      [`Total Students: ${rows.length}`],
      [`Total Classes: ${headerRow.length - 6}`], // Excluding non-date columns
      [], // Empty row for spacing
    ];
    
    const ws_data = [...metadataRows, headerRow, ...rows];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Style the worksheet
    const range = XLSX.utils.decode_range(ws['!ref']);
    
    // Set column widths
    const colWidths = [];
    headerRow.forEach((header, index) => {
      if (index === 0) colWidths.push({ width: 15 }); // Enrollment
      else if (index === 1) colWidths.push({ width: 25 }); // Name
      else if (index === 2) colWidths.push({ width: 10 }); // Class
      else if (index === 3) colWidths.push({ width: 10 }); // Gender
      else colWidths.push({ width: 12 }); // Other columns
    });
    ws['!cols'] = colWidths;
    
    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    
    // Add a summary worksheet
    const summaryData = [
      ['Attendance Summary'],
      [`Subject: ${subjectName}`],
      [`Export Date: ${new Date().toLocaleString()}`],
      [`Total Students: ${rows.length}`],
      [],
      ['Student Statistics:'],
      ['Enrollment No.', 'Name', 'Total Present', 'Attendance %']
    ];
    
    // Add student statistics
    rows.forEach(row => {
      const enrollmentNo = row[0];
      const name = row[1];
      const totalPresent = row[row.length - 2]; // Second to last column
      const attendancePercent = row[row.length - 1]; // Last column
      
      summaryData.push([enrollmentNo, name, totalPresent, attendancePercent]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
    
    // Save the Excel file
    const filename = `${subjectName.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance_${getTodayDate()}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    console.log(`✅ Excel saved as: ${filename}`);
    
  } catch (error) {
    console.error('❌ Excel export failed:', error);
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

function clearStudentForm(form) {
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.value = '';
  });
  const messageDiv = form.querySelector('.student-form-message');
  if (messageDiv) {
    messageDiv.textContent = '';
    messageDiv.style.color = '';
  }
}

function loadStudents(section, subjectKey) {
  const studentListBody = section.querySelector('.student-list-body');
  const headerElement = section.querySelector('.student-list h4');
  
  console.log(`👥 Loading students for subject: ${subjectKey}`);
  
  studentListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading students...</td></tr>';
  headerElement.innerHTML = '<i class="fas fa-users"></i> Students (Loading...)';
  
  db.ref(`subjects/${subjectKey}/students`).once('value')
    .then((snapshot) => {
      const students = snapshot.val() || {};
      const studentsList = Object.keys(students);
      
      console.log(`📊 Loaded ${studentsList.length} students for ${subjectKey}`);
      
      studentListBody.innerHTML = '';
      headerElement.innerHTML = `<i class="fas fa-users"></i> Students (${studentsList.length})`;
      
      if (studentsList.length === 0) {
        studentListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #666;"><i class="fas fa-user-plus"></i><br>No students added yet.<br><small>Click "Add Student" to get started!</small></td></tr>';
        return;
      }
      
      studentsList.forEach((enroll) => {
        const student = students[enroll];
        const row = document.createElement('tr');
        row.className = 'student-row';
        row.innerHTML = `
          <td><strong>${enroll}</strong></td>
          <td><i class="fas fa-user"></i> ${student.name}</td>
          <td><i class="fas fa-school"></i> ${student.class}</td>
          <td><i class="fas fa-venus-mars"></i> ${student.gender}</td>
          <td>${student.cast || '<em>Not specified</em>'}</td>
          <td><code class="password-code">${student.password}</code></td>
          <td>
            <button class="btn btn-sm btn-warning copy-password-btn" onclick="copyToClipboard('${student.password}', this)" title="Copy Password">
              <i class="fas fa-copy"></i>
            </button>
          </td>
        `;
        studentListBody.appendChild(row);
      });
      
      showToast(`✅ Loaded ${studentsList.length} students`, 'success');
    })
    .catch((error) => {
      console.error('❌ Error loading students:', error);
      studentListBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;"><i class="fas fa-exclamation-triangle"></i> Error loading students. Please try again.</td></tr>';
      headerElement.innerHTML = '<i class="fas fa-users"></i> Students (Error)';
      showToast('Failed to load students', 'error');
    });
}

// Enhanced copy to clipboard function
function copyToClipboard(text, element) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHTML = element.innerHTML;
      element.innerHTML = '<i class="fas fa-check"></i> Copied!';
      element.style.background = '#10b981';
      element.style.color = 'white';
      
      setTimeout(() => {
        element.innerHTML = originalHTML;
        element.style.background = '';
        element.style.color = '';
      }, 2000);
      
      showToast(`✅ Copied: ${text}`, 'success');
    }).catch(err => {
      console.error('Copy failed:', err);
      showToast('❌ Failed to copy to clipboard', 'error');
      
      // Fallback: show text in prompt
      prompt('Copy this text manually:', text);
    });
  } else {
    // Fallback for older browsers
    prompt('Copy this text manually:', text);
  }
}

// Enhanced add subject logic with validation
addSubjectBtn.onclick = function () {
  const name = subjectNameInput.value.trim();
  
  if (!name) {
    showToast('⚠️ Please enter a subject name', 'warning');
    subjectNameInput.focus();
    return;
  }
  
  if (name.length < 2) {
    showToast('⚠️ Subject name must be at least 2 characters long', 'warning');
    subjectNameInput.focus();
    return;
  }
  
  if (name.length > 50) {
    showToast('⚠️ Subject name must be less than 50 characters', 'warning');
    subjectNameInput.focus();
    return;
  }
  
  setLoadingState(addSubjectBtn, true, 'Add Subject');
  
  const subjectKey = name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').toLowerCase() + '_' + Date.now();
  
  console.log(`📚 Adding new subject: ${name} (${subjectKey})`);
  
  db.ref('subjects/' + subjectKey).set({
    name,
    createdDate: new Date().toISOString(),
    createdBy: firebase.auth().currentUser?.uid || 'unknown'
  })
  .then(() => {
    console.log(`✅ Subject ${name} added successfully`);
    subjectNameInput.value = '';
    showToast(`✅ Subject "${name}" added successfully!`, 'success');
    loadSubjects();
  })
  .catch((error) => {
    console.error('❌ Error adding subject:', error);
    showToast(`❌ Failed to add subject: ${error.message}`, 'error');
  })
  .finally(() => {
    setLoadingState(addSubjectBtn, false);
  });
};

// Enhanced keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Enter key to add subject when input is focused
  if (e.key === 'Enter' && document.activeElement === subjectNameInput) {
    addSubjectBtn.click();
  }
  
  // Ctrl+R to refresh subjects
  if ((e.ctrlKey || e.metaKey) && e.key === 'r' && !e.shiftKey) {
    e.preventDefault();
    loadSubjects();
    showToast('🔄 Refreshing subjects...', 'info');
  }
});

// Enhanced initialization with error handling
window.addEventListener('load', function() {
  console.log('🚀 Teacher Dashboard initializing...');
  
  // Check if required libraries are loaded
  const requiredLibraries = [
    { name: 'Firebase', check: () => typeof firebase !== 'undefined' },
    { name: 'jsPDF', check: () => typeof window.jspdf !== 'undefined' },
    { name: 'XLSX', check: () => typeof XLSX !== 'undefined' }
  ];
  
  const missingLibraries = requiredLibraries.filter(lib => !lib.check());
  
  if (missingLibraries.length > 0) {
    const missing = missingLibraries.map(lib => lib.name).join(', ');
    console.error(`❌ Missing required libraries: ${missing}`);
    showToast(`⚠️ Some features may not work. Missing libraries: ${missing}`, 'warning');
  }
  
  // Load subjects
  loadSubjects();
  
  console.log('✅ Teacher Dashboard loaded successfully!');
  console.log('🎯 Enhanced features: Export fix, error handling, loading states, better UX');
});

// Error handling for uncaught errors
window.addEventListener('error', function(e) {
  console.error('❌ Uncaught error:', e.error);
  showToast('⚠️ An unexpected error occurred. Please refresh the page.', 'error');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  console.error('❌ Unhandled promise rejection:', e.reason);
  showToast('⚠️ A background operation failed. Please check console for details.', 'error');
});

console.log('🎉 Enhanced Teacher Dashboard Script Loaded Successfully!');
console.log('🔧 Key fixes: Export functionality, error handling, loading states, data validation');
console.log('📊 Export features: PDF & Excel with comprehensive attendance data');