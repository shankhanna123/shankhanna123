function generateCode() {
  const subject = document.getElementById("subject").value;
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const today = new Date().toISOString().split('T')[0];

  firebase.database().ref('codes/' + today).set(code);
  document.getElementById("generatedCode").innerText = "Code for today: " + code;
}
