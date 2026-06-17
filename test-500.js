const payload = { accounts: [{ name: "Conta do PC" }], users: [{ username: "hollywood" }] };
fetch('http://localhost:3000/api/db?identifier=hollywood-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
}).then(res => res.text().then(text => console.log(res.status, text)));
