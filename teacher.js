// teacher.js

document.addEventListener('DOMContentLoaded', function() {
  const addSubjectBtn = document.getElementById('add-subject-btn');
  const subjectNameInput = document.getElementById('subject-name');
  const subjectsContainer = document.getElementById('subjects-container');

  // Helper to create subject element
  function createSubjectElement(subjectName) {
    const div = document.createElement('div');
    div.className = 'subject-section';
    div.innerHTML = `
      <h3>${subjectName}</h3>
      <!-- You can add more controls here for each subject -->
    `;
    return div;
  }

  // Add subject to UI and Firebase
  addSubjectBtn.addEventListener('click', function() {
    const subjectName = subjectNameInput.value.trim();
    if (!subjectName) {
      alert('Please enter a subject name.');
      return;
    }

    // Add to Firebase (assuming user is logged in and has uid)
    const user = firebase.auth().currentUser;
    if (!user) {
      alert('You must be logged in to add subjects.');
      return;
    }

    // Save subject under teacher's node
    const subjectRef = firebase.database().ref('teachers/' + user.uid + '/subjects');
    const newSubjectRef = subjectRef.push();
    newSubjectRef.set({
      name: subjectName
    }).then(() => {
      // Add to UI
      subjectsContainer.appendChild(createSubjectElement(subjectName));
      subjectNameInput.value = '';
    }).catch(err => {
      alert('Failed to add subject: ' + err.message);
    });
  });

  // Show existing subjects on load (if logged in)
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      const subjectRef = firebase.database().ref('teachers/' + user.uid + '/subjects');
      subjectRef.once('value', function(snapshot) {
        subjectsContainer.innerHTML = '';
        snapshot.forEach(function(childSnap) {
          const data = childSnap.val();
          if (data && data.name) {
            subjectsContainer.appendChild(createSubjectElement(data.name));
          }
        });
      });
    }
  });
});

// Example utility for generating a random code (if needed elsewhere)
function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
