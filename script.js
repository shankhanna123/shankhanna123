function generateCode() {
  const code = Math.floor(100000 + Math.random() * 900000); // 6-digit random code
  document.getElementById("codeDisplay").innerText = `Code: ${code}`;
  saveCodeToFirebase(code);
}

function saveCodeToFirebase(code) {
  const database = firebase.database();
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  database.ref("attendanceCodes/" + timestamp).set({
    code: code,
    timestamp: timestamp
  });
}
