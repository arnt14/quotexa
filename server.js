const express = require("express");
const PDFDocument = require("pdfkit");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const session = require("express-session");

const db = new sqlite3.Database("./quotexa.db");

db.run(`
CREATE TABLE IF NOT EXISTS offers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
customer TEXT,
userID INTEGER,
service1 TEXT,
price1 INTEGER,
service2 TEXT,
price2 INTEGER,
total INTEGER,
createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
offerNumber TEXT
)
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE,
  password TEXT
  )
  `);

require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: "quotexa-secret",
  resave: false,
  saveUninitialized: false
  }));

db.run(`
CREATE TABLE IF NOT EXISTS offers (
id INTEGER PRIMARY KEY AUTOINCREMENT,
customer TEXT,
items TEXT,
total INTEGER,
date TEXT
)
`);

db.run(`ALTER TABLE offers ADD COLUMN offerNumber TEXT`, (err) => {
  if (err) {
  // ok wenn schon vorhanden
  }
  });

  db.run("ALTER TABLE offers ADD COLUMN userId INTEGER", err => {
    if (err) {
    console.log("userId existiert schon");
    }
   });

const offers = [];

app.get("/", (req, res) => {
res.send(`
<html>
<head>
<title>Quotexa</title>

<style>
body{
margin:0;
font-family:Arial;
background:#f4f7fb;
display:flex;
}

.sidebar{
width:240px;
background:#111827;
height:100vh;
color:white;
padding:30px 20px;
}

.logo{
font-size:30px;
font-weight:bold;
margin-bottom:40px;
}

.menu a{
display:block;
color:white;
text-decoration:none;
padding:14px;
margin-bottom:10px;
border-radius:10px;
background:#1f2937;
}

.menu a:hover{
background:#2563eb;
}

.content{
flex:1;
padding:50px;
}

.card{
background:white;
padding:40px;
border-radius:20px;
box-shadow:0 4px 20px rgba(0,0,0,0.08);
}

h1{
margin-top:0;
}

.button{
background:#2563eb;
color:white;
padding:14px 22px;
border:none;
border-radius:10px;
text-decoration:none;
display:inline-block;
margin-top:20px;
}

.button:hover{
background:#1d4ed8;
}
</style>

</head>

<body>

<div class="sidebar">
<div class="logo">Quotexa</div>

<div class="menu">
<a href="/generate-offer">📄 Neues Angebot</a>
<a href="/angebote">📁 Angebote</a>
<a href="/dashboard">📊 Dashboard</a>
<a href="/login">🔐 Login</a>
<a href="/register">📝 Registrieren</a>
</div>
</div>

<div class="content">

<div class="card">
<h1>Willkommen bei Quotexa</h1>

<p>
Erstelle professionelle Angebote für Kunden in Sekunden.
</p>

<a class="button" href="/generate-offer">
Angebot erstellen
</a>
</div>

</div>

</body>
</html>
`);
});

app.get("/", (req, res) => {
res.send(`
<html>
<head>
<title>Quotexa</title>

<style>
body {
font-family: Arial;
background: #f4f4f4;
padding: 40px;
}

.card {
background: white;
padding: 20px;
border-radius: 10px;
max-width: 500px;
margin: auto;
}

input {
width: 100%;
padding: 10px;
margin-bottom: 15px;
}

button {
padding: 12px;
background: black;
color: white;
border: none;
border-radius: 5px;
}
a:empty {
display: none !important;
}
</style>
</head>

<body>
<div class="card">
<h1>Quotexa</h1>

<form action="/generate-offer" method="GET">

<input name="customer" placeholder="Kundenname" />

<input name="service1" placeholder="Leistung 1" />
<br><br>

<input type="number" name="price1" placeholder="Preis 1" />
<br><br>

<input name="service2" placeholder="Leistung 2" />
<br><br>

<input type="number" name="price2" placeholder="Preis 2" />

<button type="submit">
Angebot erstellen
</button>

</form>
</div>
</body>
</html>
`);
});

app.get("/login", (req, res) => {
res.send(`
<h1>Login</h1>
<form>
<input placeholder="E-Mail"><br><br>
<input type="password" placeholder="Passwort"><br><br>
<button>Einloggen</button>
</form>
<br>
<a href="/">Zurück</a>
`);
});

app.get("/offers", (req, res) => {

  db.all("SELECT id, customer, items, total, date, offerNumber FROM offers", [], (err, rows) => {
  
  res.send(`
  <html>
  <body style="
  font-family:Arial;
  background:#f4f4f4;
  padding:40px;
  ">
  
  <h1>Gespeicherte Angebote</h1>
  
  ${rows.map((offer, index) => {
  
  const items = JSON.parse(offer.items);
  
  return `
  <div style="
  background:white;
  padding:20px;
  margin-bottom:20px;
  border-radius:12px;
  box-shadow:0 2px 10px rgba(0,0,0,0.1);
  ">
  
  <h2>${offer.customer}</h2>
  
  <p>
  <strong>Datum:</strong>
  ${offer.date}
  </p>

<p><strong>Angebotsnummer:</strong> ${offer.offerNumber}</p>
  
  ${items.map(item => `
  <div style="
  background:#f4f4f4;
  padding:10px;
  margin-top:10px;
  border-radius:8px;
  ">
  ${item.title} - ${item.price} CHF
  </div>
  `).join("")}
  
  <h3>
  Gesamt: ${offer.total} CHF
  </h3>
  <a href="/delete-offer/${offer.id}">
<button style="
background:red;
color:white;
border:none;
padding:10px 15px;
border-radius:8px;
cursor:pointer;
">
Löschen
</button>
</a>
<a href="/edit-offer/${offer.id}">
<button style="
background:#111827;
color:white;
border:none;
padding:10px 15px;
border-radius:8px;
cursor:pointer;
margin-left:10px;
">
Bearbeiten
</button>
</a>

  </div>
  `;
  
  }).join("")}
  
  </body>
  </html>
  `);
  
  });
  
  });

  app.get("/angebote", (req, res) => {
    db.all("SELECT * FROM offers ORDER BY id DESC", [], (err, rows) => {
    if (err) {
    return res.send("Fehler beim Laden der Angebote");
    }
   
    res.send(`
    <html>
    <head>
    <title>Quotexa Angebote</title>
    </head>
    <body style="font-family: Arial; background:#f4f4f4; padding:40px;">
    <div style="max-width:900px; margin:auto;">
    <h1>Quotexa</h1>
    <p style="color:gray;">Gespeicherte Angebote</p>
   
    <a href="/" style="background:#2563EB; color:white; padding:10px 14px; border-radius:8px; text-decoration:none;">
    Neues Angebot
    </a>
   
    <br><br>
   
    ${rows.map(offer => `
    <div style="background:white; padding:20px; margin-bottom:16px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.08);">
    <h2>${offer.customer}</h2>
    <p><strong>Angebotsnummer:</strong> ${offer.offerNumber || "-"}</p>
    <p><strong>Total:</strong> ${offer.total} CHF</p>
    <p><strong>Datum:</strong> ${offer.createdAt || offer.date || "-"}</p>


<a href="/download-pdf?customer=${offer.customer}&offerNumber=${offer.offerNumber}"
style="
background:#2563EB;
color:white;
padding:10px 14px;
border-radius:8px;
text-decoration:none;
display:inline-block;
margin-top:10px;
">
PDF öffnen
</a>

<a href="/delete-offer/${offer.id}"
style="
background:#DC2626;
color:white;
padding:10px 14px;
border-radius:8px;
text-decoration:none;
display:inline-block;
margin-top:10px;
margin-left:10px;
">
Löschen
</a>

<a href="/edit-offer/${offer.id}"
style="
background:#F59E0B;
color:white;
padding:10px 14px;
border-radius:8px;
text-decoration:none;
display:inline-block;
margin-top:10px;
margin-left:10px;
">
Bearbeiten
</a>

    </div>
    `).join("")}
    </div>
    </body>
    </html>
    `);
    });
   });

  app.get("/generate-offer", (req, res) => {

const offer = {
customer: req.query.customer || "Max Mustermann",

items: [
  {
  title: req.query.service1,
  price: Number(req.query.price1)
  },
  
  {
  title: req.query.service2,
  price: Number(req.query.price2)
  }
]
};

const total = offer.items.reduce((sum, item) => {
return sum + item.price;
}, 0);

const offerNumber = "ANG-" + Date.now();

console.log("ANGEBOTSNUMMER:", offerNumber);

const userId = req.session.userId;

db.run(
  `INSERT INTO offers (customer, userId, items, total, date, offerNumber)
  VALUES (?, ?, ?, ?, ?, ?)`,
  [
  offer.customer,
  userId,
  JSON.stringify(offer.items),
  total,
  new Date().toLocaleDateString("de-DE"),
  offerNumber
  ],
  (err) => {
  if (err) {
  console.log(err);
  }
  }
  );

res.send(`
<html>
<head>
<title>Quotexa</title>

<style>
body {
font-family: Arial;
background: #f4f4f4;
padding: 40px;
}

.card {
background: white;
padding: 20px;
border-radius: 10px;
max-width: 600px;
margin: auto;
}

.item {
background: #f1f1f1;
padding: 10px;
margin-bottom: 10px;
border-radius: 5px;
}

.total {
font-size: 28px;
font-weight: bold;
}
</style>
</head>

<body>
<div class="card">

<h1>Quotexa</h1>
<p style="color: gray; font-size: 16px; margin-top: -10px;">
Smart Offers for Service Businesses
</p>
<h2>Angebot für ${offer.customer}</h2>

${offer.items.map(item => `
  <div class="item">
  ${item.title} - ${item.price} CHF
  </div>
  `).join("")}

<div class="total">
Gesamt: ${total} CHF
</div>

<br>

<a href="/download-pdf?customer=${offer.customer}&offerNumber=${offer.offerNumber}"
style="
background:#2563EB;
color:white;
padding:10px 14px;
border-radius:8px;
text-decoration:none;
display:inline-block;
margin-top:10px;
">
PDF öffnen
</a>

</div>
</body>
</html>
`);

});

const PORT = 3000;
 
app.get("/download-pdf", (req, res) => {
  const offerNumber = req.query.offerNumber;
 
  db.get("SELECT * FROM offers WHERE offerNumber = ?", [offerNumber], (err, offer) => {
  if (err || !offer) {
  return res.send("Angebot nicht gefunden");
  }
 
  const doc = new PDFDocument();
  doc.image("public/logo.png", 50, 45, { width: 120 });
 
  const items = JSON.parse(offer.items || "[]");
  const customer = offer.customer;
  const total = offer.total;
 
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=angebot.pdf");
 
  doc.pipe(res);
 
  doc.fontSize(26).text("Quotexa Angebot", { align: "center" });
  doc.moveDown(2);
 
  doc.fontSize(14).text(`Angebotsnummer: ${offer.offerNumber || "-"}`);
  doc.text(`Kunde: ${customer}`);
  doc.text(`Datum: ${offer.createdAt || offer.date || "-"}`);
 
  doc.moveDown();
 
  doc.fontSize(14).text("Leistungen:");
  doc.moveDown(0.5);
 
  items.forEach(item => {
  doc.fontSize(12).text(`${item.title} - ${item.price} CHF`);
  });
 
  doc.moveDown();
 
  doc.fontSize(24).text(`Gesamt: ${total} CHF`, {
  align: "right"
  });
 
  doc.end();
  });
 });

 app.get("/offers", (req, res) => {
  res.send(`
  <html>
  <body>
  
  <h1>Gespeicherte Angebote</h1>
  
  ${rows.map((offer, index) =>`
  <div style="
background:white;
padding:20px;
margin-bottom:20px;
border-radius:12px;
box-shadow:0 2px 10px rgba(0,0,0,0.1);
">

<h2>${offer.customer}</h2>

<p><strong>Datum:</strong> ${offer.date}</p>

<p style="color:red;">TEST: ${offer.offerNumber || "leer"}</p>

<p><strong>Angebotsnummer:</strong> ${offer.offerNumber || "leer"}</p>

<div style="background:#f4f4f4; padding:10px; margin-top:10px; border-radius:8px;">
${offer.service1} - ${offer.price1} CHF
</div>

<div style="background:#f4f4f4; padding:10px; margin-top:10px; border-radius:8px;">
${offer.service2} - ${offer.price2} CHF
</div>

<h3 style="margin-top:20px;">
Gesamt: ${offer.total} CHF
</h3>

<a href="/delete-offer/${offer.id}">
<button style="
background:red;
color:white;
border:none;
padding:10px 15px;
border-radius:8px;
cursor:pointer;
">
Löschen
</button>
</a>
<a href="/edit-offer/${offer.id}">
<button style="
background:#111827;
color:white;
border:none;
padding:10px 15px;
border-radius:8px;
cursor:pointer;
margin-left:10px;
">
Bearbeiten
</button>
</a>

</div>
`).join("")}
  
  </body>
  </html>
  `);
  });

  app.get("/delete-offer/:id", (req, res) => {
    db.run(
    "DELETE FROM offers WHERE id = ?",
    [req.params.id],
    (err) => {
    if (err) {
    console.log(err);
    }
    
    res.redirect("/offers");
    }
    );
    });

  app.get("/edit-offer/:id", (req, res) => {

    const id = req.params.id;
    
    db.get("SELECT * FROM offers WHERE id = ?", [id], (err, offer) => {
    
    const items = JSON.parse(offer.items);
    
    res.send(`
    <html>
    <body style="
    font-family:Arial;
    background:#f4f4f4;
    padding:40px;
    ">
    
    <h1>Angebot bearbeiten</h1>
    
    <form action="/update-offer/${offer.id}" method="GET">
    
    <input
    type="text"
    name="customer"
    value="${offer.customer}"
    style="
    width:300px;
    padding:10px;
    margin-bottom:20px;
    "
    />
    
    <br>
    
    <input
    type="text"
    name="service1"
    value="${items[0].title}"
    />
    
    <input
    type="number"
    name="price1"
    value="${items[0].price}"
    />
    
    <br><br>
    
    <input
    type="text"
    name="service2"
    value="${items[1].title}"
    />
    
    <input
    type="number"
    name="price2"
    value="${items[1].price}"
    />
    
    <br><br>
    <h2 id="gesamtAnzeige"></h2>

    <button type="submit">
    Speichern
    </button>
    
    </form>
    
    </body>
    </html>
    `);
    
    });
    
    });

    app.get("/delete-offer/:index", (req, res) => {

      db.run(
      "DELETE FROM offers WHERE id = ?",
      [req.params.index],
      (err) => {
      
      if (err) {
      console.log(err);
      }
      
      res.redirect("/offers");
      
      }
      );
      });

  app.get("/update-offer/:id", (req, res) => {

const items = [
{
title: req.query.service1,
price: Number(req.query.price1)
},
{
title: req.query.service2,
price: Number(req.query.price2)
}
];

const total = items.reduce((sum, item) => {
return sum + item.price;
}, 0);

db.run(
`UPDATE offers
SET customer = ?, items = ?, total = ?
WHERE id = ?`,
[
req.query.customer,
JSON.stringify(items),
total,
req.params.id
],
(err) => {
if (err) {
console.log(err);
}

res.redirect("/offers");
}
);

});

app.get("/kunden", (req, res) => {
  db.all(
  "SELECT DISTINCT customer FROM offers ORDER BY customer ASC",
  [],
  (err, rows) => {
  if (err) {
  return res.send("Fehler beim Laden der Kunden");
  }
  
  res.send(`
  <html>
  <head>
  <title>Quotexa Kunden</title>
  </head>
  <body style="font-family:Arial;background:#f4f4f4;padding:40px;">
  <div style="max-width:800px;margin:auto;">
  <h1>Quotexa Kunden</h1>
  <p style="color:gray;">Alle Kunden aus deinen Angeboten</p>
  <input
id="searchInput"
type="text"
placeholder="Kunden suchen..."
onkeyup="searchCustomers()"
style="width:100%;padding:12px;margin:15px 0;border:1px solid #ddd;border-radius:8px;"
>
  
  <a href="/" style="background:#2563EB;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">
  Neues Angebot
  </a>
  
  <a href="/angebote" style="background:#111827;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;margin-left:10px;">
  Angebote
  </a>
  
  <br><br>
  
  ${rows.map(row => `
  <div class="customer-card" style="background:white;padding:18px;margin-bottom:12px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
  <h2>
<a href="/kunde/${encodeURIComponent(row.customer)}" style="color:#111827;text-decoration:none;">
${row.customer}
</a>
</h2>
  </div>
  `).join("")}
  </div>
  <script>
function searchCustomers() {
const input = document.getElementById("searchInput").value.toLowerCase();
const cards = document.querySelectorAll(".customer-card");

cards.forEach(card => {
const text = card.innerText.toLowerCase();
card.style.display = text.includes(input) ? "block" : "none";
});
}
</script>
  </body>
  </html>
  `);
  }
  );
  });

  app.get("/kunde/:name", (req, res) => {
    const name = req.params.name;
    
    db.all(
    "SELECT * FROM offers WHERE customer = ? ORDER BY id DESC",
    [name],
    (err, rows) => {
    if (err) {
    return res.send("Fehler beim Laden der Kundendetails");
    }
    
    res.send(`
    <html>
    <head>
    <title>Kunde ${name}</title>
    </head>
    <body style="font-family:Arial;background:#f4f4f4;padding:40px;">
    <div style="max-width:900px;margin:auto;">
    <h1>${name}</h1>
    <p style="color:gray;">Alle Angebote von ${name}</p>
    
    <a href="/kunden" style="background:#111827;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">
    Zurück zu Kunden
    </a>
    
    <a href="/angebote" style="background:#2563EB;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;margin-left:10px;">
    Angebote
    </a>
    
    <br><br>
    
    ${rows.map(offer => `
    <div style="background:white;padding:20px;margin-bottom:16px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
    <h2>Angebot ${offer.offerNumber || "-"}</h2>
    <p><strong>Total:</strong> ${offer.total} CHF</p>
    <p><strong>Datum:</strong> ${offer.createdAt || offer.date || "-"}</p>
    
    <a href="/download-pdf?id=${offer.id}"
    style="background:#2563EB;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:10px;">
    PDF öffnen
    </a>
    </div>
    `).join("")}
    </div>
    </body>
    </html>
    `);
    }
    );
    });

    app.get("/dashboard", (req, res) => {
      db.all(
        "SELECT * FROM offers WHERE userId = ?",
        [req.session.userId],
        (err, rows) => {
      if (err) {
      return res.send("Fehler beim Laden vom Dashboard");
      }
      
      const totalRevenue = rows.reduce((sum, offer) => sum + Number(offer.total || 0), 0);
      const offerCount = rows.length;
      const customers = [...new Set(rows.map(offer => offer.customer))];
      const customerCount = customers.length;
      
      res.send(`
      <html>
      <head>
      <title>Quotexa Dashboard</title>
      </head>
      <body style="font-family:Arial;background:#f4f4f4;padding:40px;">
      <div style="max-width:900px;margin:auto;">
      <h1>Quotexa Dashboard</h1>
      <a href="/logout"
style="
background:#DC2626;
color:white;
padding:10px 14px;
border-radius:8px;
text-decoration:none;
margin-left:10px;
">
Logout
</a>
      <p style="color:gray;">Übersicht deiner Angebote</p>
      
      <a href="/" style="background:#2563EB;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;">
      Neues Angebot
      </a>
      
      <a href="/angebote" style="background:#111827;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;margin-left:10px;">
      Angebote
      </a>
      
      <a href="/kunden" style="background:#16A34A;color:white;padding:10px 14px;border-radius:8px;text-decoration:none;margin-left:10px;">
      Kunden
      </a>
      
      <br><br>
      
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
      <div style="background:white;padding:25px;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
      <p style="color:gray;">Gesamtumsatz</p>
      <h2>${totalRevenue} CHF</h2>
      </div>
      
      <div style="background:white;padding:25px;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
      <p style="color:gray;">Angebote</p>
      <h2>${offerCount}</h2>
      </div>
      
      <div style="background:white;padding:25px;border-radius:14px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">
      <p style="color:gray;">Kunden</p>
      <h2>${customerCount}</h2>
      </div>
      </div>
      </div>
      </body>
      </html>
      `);
      });
      });  

      app.get("/delete-offer/:id", (req, res) => {
        const id = req.params.id;
        
        db.run("DELETE FROM offers WHERE id = ?", [id], err => {
        if (err) {
        return res.send("Fehler beim Löschen");
        }
        
        res.redirect("/angebote");
        });
        });

        app.get("/edit-offer/:id", (req, res) => {
          const id = req.params.id;
          
          db.get("SELECT * FROM offers WHERE id = ?", [id], (err, offer) => {
          if (err || !offer) {
          return res.send("Angebot nicht gefunden");
          }
          
          res.send(`
          <html>
          <head>
          <title>Angebot bearbeiten</title>
          </head>
          <body style="font-family:Arial;background:#f4f4f4;padding:40px;">
          <div style="max-width:700px;margin:auto;background:white;padding:30px;border-radius:14px;">
          
          <h1>Angebot bearbeiten</h1>
          
          <form method="POST" action="/update-offer/${offer.id}">
          
          <label>Kunde</label><br><br>
          <input
          type="text"
          name="customer"
          value="${offer.customer}"
          style="width:100%;padding:12px;margin-bottom:20px;"
          >
          
          <label>Total</label><br><br>
          <input
          type="number"
          name="total"
          value="${offer.total}"
          style="width:100%;padding:12px;margin-bottom:20px;"
          >
          
          <button
          type="submit"
          style="
          background:#2563EB;
          color:white;
          border:none;
          padding:12px 18px;
          border-radius:8px;
          cursor:pointer;
          "
          >
          <h2 id="gesamtAnzeige"></h2>

          <button type="submit">
          Speichern
          </button>
          
          </form>

        <script>
function updateTotal() {
const prices = document.querySelectorAll('input[type="number"]');
let total = 0;

prices.forEach(input => {
total += Number(input.value || 0);
});

document.getElementById("gesamtAnzeige").innerText = "Gesamt: " + total + " CHF";
}

document.querySelectorAll('input[type="number"]').forEach(input => {
input.addEventListener("input", updateTotal);
});

updateTotal();
</script>
          
          </div>
          </body>
          </html>
          `);
          });
          });
          
          app.post("/update-offer/:id", (req, res) => {
            const id = req.params.id;
            const { customer, service1, price1, service2, price2 } = req.body;

const items = [
{ title: service1, price: Number(price1 || 0) },
{ title: service2, price: Number(price2 || 0) }
];

const total = Number(price1 || 0) + Number(price2 || 0);
            
db.run(
  "UPDATE offers SET customer = ?, items = ?, total = ? WHERE id = ?",
  [customer, JSON.stringify(items), total, id],
  err => {
    if (err) { 
            return res.send("Fehler beim Speichern");
            }
            
            res.redirect("/angebote");
            }
            );
            });      
            
            app.get("/register", (req, res) => {
              res.send(`
              <h1>Registrieren</h1>
              <form method="POST" action="/register">
              <input name="email" placeholder="E-Mail"><br><br>
              <input name="password" type="password" placeholder="Passwort"><br><br>
              <button>Registrieren</button>
              </form>
              `);
              });
              
              app.post("/register", async (req, res) => {
              const { email, password } = req.body;
              const hashed = await bcrypt.hash(password, 10);
              
              db.run(
              "INSERT INTO users (email, password) VALUES (?, ?)",
              [email, hashed],
              err => {
              if (err) {
              return res.send("Benutzer existiert bereits");
              }
              
              res.redirect("/login");
              }
              );
              });   

              app.get("/login", (req, res) => {
                res.send(`
                <h1>Login</h1>
                <form method="POST" action="/login">
                <input name="email" placeholder="E-Mail"><br><br>
                <input name="password" type="password" placeholder="Passwort"><br><br>
                <button>Login</button>
                </form>
                `);
               });
               
               app.post("/login", (req, res) => {
                const { email, password } = req.body;
               
                db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
                if (!user) return res.send("User nicht gefunden");
               
                const ok = await bcrypt.compare(password, user.password);
                if (!ok) return res.send("Falsches Passwort");

req.session.userId = user.id;
req.session.email = user.email;

res.redirect("/dashboard");
                });
               });

               app.get("/logout", (req, res) => {
                req.session.destroy(() => {
                res.redirect("/login");
                });
                });            
    
app.listen(PORT, () => {
console.log("Server läuft auf Port " + PORT);
});
