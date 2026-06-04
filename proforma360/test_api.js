const apiUrl = "https://script.google.com/macros/s/AKfycby_lu3r1yIpFnJRzvcDEALWPav-EJK0tJ0uEWyxDYt8HY1dWpZE_3OYQEZaY4__kVDr/exec";

async function test() {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "check",
        user_id: "test",
        email: "egaslemos@gmail.com",
        company_name: "Test"
      })
    });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Response text:", text);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
