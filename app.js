const STORAGE_KEY = "campusFindReports";
let currentUser = null;

const roleSelect = document.getElementById("role");
const accountIdLabel = document.getElementById("accountIdLabel");
const accountIdInput = document.getElementById("accountId");

// Show Student ID for users and Admin ID for admins.
roleSelect.addEventListener("change", function () {
  if (roleSelect.value === "admin") {
    accountIdLabel.textContent = "Admin ID";
    accountIdInput.placeholder = "Enter your admin ID";
  } else {
    accountIdLabel.textContent = "Student ID";
    accountIdInput.placeholder = "Enter your student ID";
  }
});

function getReports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
      lost: [],
      found: []
    };
  } catch {
    return { lost: [], found: [] };
  }
}

function saveReports(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function createReportCard(report, type) {
  const card = document.createElement("article");
  card.className = "report-card";

  const badge = document.createElement("span");
  badge.className = type === "Found" ? "badge found" : "badge";
  badge.textContent = type.toUpperCase();

  const heading = document.createElement("h3");
  heading.textContent = report.name;

  const location = document.createElement("p");
  location.textContent = `Location: ${report.location}`;

  const date = document.createElement("p");
  date.textContent = `Date: ${report.date}`;

  const category = document.createElement("p");
  category.textContent = `Category: ${report.category}`;

  const description = document.createElement("p");
  description.textContent = `Description: ${report.description}`;

  card.append(badge, heading, location, date, category, description);
  return card;
}

function renderAdminLists() {
  const reports = getReports();
  const lostList = document.getElementById("lostReportsList");
  const foundList = document.getElementById("foundItemsList");

  lostList.replaceChildren();
  foundList.replaceChildren();

  if (reports.lost.length === 0) {
    lostList.textContent = "There are no user lost-item reports yet.";
  } else {
    reports.lost.forEach(function (lostReport) {
      const card = createReportCard(lostReport, "Lost");

      const email = document.createElement("p");
      email.textContent = `User: ${lostReport.reporterName} — ${lostReport.email}`;
      card.appendChild(email);

      lostList.appendChild(card);
    });
  }

  if (reports.found.length === 0) {
    foundList.textContent = "There are no found-item reports yet.";
  } else {
    reports.found.forEach(function (foundReport) {
      const card = createReportCard(foundReport, "Found");

      const matches = reports.lost.filter(function (lostReport) {
        return lostReport.name.trim().toLowerCase() ===
          foundReport.name.trim().toLowerCase();
      });

      if (matches.length > 0) {
        const notice = document.createElement("p");
        notice.textContent = `Exact item-name match found (${matches.length}).`;
        notice.style.fontWeight = "bold";
        card.appendChild(notice);

        matches.forEach(function (lostReport) {
          const contactLink = document.createElement("a");
          contactLink.className = "contact-link";
          contactLink.href =
            `mailto:${encodeURIComponent(lostReport.email)}` +
            `?subject=${encodeURIComponent("Your lost item may have been found")}` +
            `&body=${encodeURIComponent(
              `Hello ${lostReport.reporterName}, an item matching your report (${foundReport.name}) has been found at ${foundReport.location}.`
            )}`;
          contactLink.textContent =
            `Contact ${lostReport.reporterName} (${lostReport.email})`;
          contactLink.style.display = "block";
          card.appendChild(contactLink);
        });
      }

      foundList.appendChild(card);
    });
  }
}

// Demo login. The role and password are not verified by a server.
document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  currentUser = {
    role: roleSelect.value,
    name: document.getElementById("loginName").value.trim(),
    id: accountIdInput.value.trim(),
    email: document.getElementById("loginEmail").value.trim()
  };

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").style.display = "block";

  if (currentUser.role === "admin") {
    document.getElementById("userDashboard").style.display = "none";
    document.getElementById("adminDashboard").style.display = "block";
    renderAdminLists();
  } else {
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById("userDashboard").style.display = "block";
  }
});

// Users submit lost-item reports.
document.getElementById("lostItemForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const reports = getReports();

  reports.lost.push({
    name: document.getElementById("lostName").value.trim(),
    category: document.getElementById("lostCategory").value,
    location: document.getElementById("lostLocation").value.trim(),
    date: document.getElementById("lostDate").value,
    description: document.getElementById("lostDescription").value.trim(),
    email: currentUser.email,
    reporterName: currentUser.name,
    studentId: currentUser.id
  });

  saveReports(reports);
  document.getElementById("lostItemForm").reset();
  document.getElementById("userMessage").style.display = "block";
});

// Admins add found items and check for exact name matches.
document.getElementById("foundItemForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const reports = getReports();

  const foundReport = {
    name: document.getElementById("foundName").value.trim(),
    category: document.getElementById("foundCategory").value,
    location: document.getElementById("foundLocation").value.trim(),
    date: document.getElementById("foundDate").value,
    description: document.getElementById("foundDescription").value.trim()
  };

  reports.found.push(foundReport);
  saveReports(reports);

  const hasMatch = reports.lost.some(function (lostReport) {
    return lostReport.name.trim().toLowerCase() ===
      foundReport.name.trim().toLowerCase();
  });

  document.getElementById("foundItemForm").reset();
  renderAdminLists();

  if (hasMatch) {
    alert("Exact item-name match found. Use the Contact link to email the user.");
  } else {
    alert("Found-item report added. No exact item-name match was found.");
  }
});

document.getElementById("logoutButton").addEventListener("click", function () {
  currentUser = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("loginForm").reset();
  document.getElementById("userMessage").style.display = "none";

  // Reset the login ID label to Student ID.
  roleSelect.value = "user";
  roleSelect.dispatchEvent(new Event("change"));
});