function submitAttendance() {
  const name = document.getElementById("studentName").value;
  const code = document.getElementById("codeInput").value;
  const today = new Date().toISOString().split('T')[0];

  firebase.database().ref('codes/' + today).once('value', snapshot => {
    if (snapshot.exists() && snapshot.val() === code) {
      const newRef = firebase.database().ref('attendance/' + today).push();
      newRef.set({
        name: name,
        time: new Date().toLocaleTimeString()
      });
      document.getElementById("message").innerText = "Attendance marked!";
    } else {
      document.getElementById("message").innerText = "Invalid code!";
    }
  });
}
