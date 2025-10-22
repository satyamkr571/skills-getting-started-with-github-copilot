document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Inject styles for a prettier participants list (idempotent)
  function ensureParticipantsStyles() {
    if (document.getElementById("participants-styles")) return;
    const style = document.createElement("style");
    style.id = "participants-styles";
    style.textContent = `
      .participants { margin-top:8px; padding-top:8px; border-top:1px solid #eee; }
      .participants-title { margin:0 0 6px 0; font-weight:600; font-size:13px; }
      .participants-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
      .participant-item { display:flex; align-items:center; gap:10px; padding:4px; transition:background .12s ease;border-radius:6px; }
      .participant-item:hover { background:#fbfbff; }
      .participant-avatar { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#6dd5ed,#2193b0); color:#fff; display:inline-flex; align-items:center; justify-content:center; font-weight:600; font-size:13px; flex:0 0 32px; }
      .participant-name { font-size:14px; color:#111; }
      .participant-meta { font-size:12px; color:#666; margin-left:6px; }
      .no-participants { font-style:italic; margin:4px 0; color:#666; }
    `;
    document.head.appendChild(style);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    ensureParticipantsStyles();
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Title
        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        // Description
        const desc = document.createElement("p");
        desc.textContent = details.description;
        activityCard.appendChild(desc);

        // Schedule
        const scheduleP = document.createElement("p");
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;
        activityCard.appendChild(scheduleP);

        // Availability
        const availP = document.createElement("p");
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;
        activityCard.appendChild(availP);

        // Participants section
        const participantsContainer = document.createElement("div");
        participantsContainer.className = "participants";

        const participantsTitle = document.createElement("p");
        participantsTitle.className = "participants-title";
        participantsTitle.textContent = "Participants:";
        participantsContainer.appendChild(participantsTitle);

        if (Array.isArray(details.participants) && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((p) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            // Derive a friendly display name and meta (domain) if email-like
            let display = p;
            let meta = "";
            if (typeof p === "string" && p.includes("@")) {
              const [local, domain] = p.split("@");
              display = local;
              meta = domain;
            }

            // Avatar with initials
            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            const parts = String(display).replace(/[._-]/g, " ").split(/\s+/).filter(Boolean);
            const initials = (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "");
            avatar.textContent = initials || display[0]?.toUpperCase() || "?";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = display;

            li.appendChild(avatar);
            li.appendChild(nameSpan);

            if (meta) {
              const metaSpan = document.createElement("span");
              metaSpan.className = "participant-meta";
              metaSpan.textContent = `· ${meta}`;
              li.appendChild(metaSpan);
            }

            ul.appendChild(li);
          });

          participantsContainer.appendChild(ul);
        } else {
          const none = document.createElement("p");
          none.className = "no-participants";
          none.textContent = "No participants yet — be the first!";
          participantsContainer.appendChild(none);
        }

        activityCard.appendChild(participantsContainer);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
