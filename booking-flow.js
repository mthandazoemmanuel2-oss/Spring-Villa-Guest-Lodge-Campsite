const bookingDraftKey = "springVillaBookingDraft";
const bookingStays = {
  "standard-room": "Standard room · Acacia Rest",
  "family-unit": "Family unit · Family Nest",
  campsite: "Campsite · Starlit Lawn",
};

function getLocalDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function initializeBookingForm() {
  const form = document.getElementById("bookingRequestForm");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const stayType = document.getElementById("stayType");
  const roomPreference = document.getElementById("roomPreference");
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  const guestCount = document.getElementById("guestCount");
  const message = document.getElementById("bookingFormMessage");
  const today = getLocalDateString(new Date());

  const requestedStay = params.get("stay");
  if (requestedStay && Object.hasOwn(bookingStays, requestedStay)) stayType.value = requestedStay;

  const requestedRoom = params.get("room");
  if (requestedRoom) roomPreference.value = requestedRoom;

  checkIn.min = today;
  checkOut.min = today;
  ["checkIn", "checkOut"].forEach((fieldName) => {
    const requestedDate = params.get(fieldName);
    const field = document.getElementById(fieldName);
    if (requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= today) {
      field.value = requestedDate;
    }
  });

  const requestedGuests = params.get("guests");
  if (requestedGuests && Array.from(guestCount.options).some((option) => option.value === requestedGuests)) {
    guestCount.value = requestedGuests;
  }

  if (params.get("edit") === "1") {
    try {
      const savedDraft = window.sessionStorage.getItem(bookingDraftKey);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft && Object.hasOwn(bookingStays, draft.stayType)) {
          stayType.value = draft.stayType;
          roomPreference.value = draft.roomPreference || "";
          checkIn.value = draft.checkIn || "";
          checkOut.value = draft.checkOut || "";
          if (Array.from(guestCount.options).some((option) => option.value === draft.guestCount)) {
            guestCount.value = draft.guestCount;
          }
          document.getElementById("guestName").value = draft.guestName || "";
          document.getElementById("guestPhone").value = draft.guestPhone || "";
          document.getElementById("guestEmail").value = draft.guestEmail || "";
          document.getElementById("guestNotes").value = draft.guestNotes || "";
        }
      }
    } catch (error) {
      message.textContent = `Could not restore your saved request: ${error.message}. You can still enter your details again.`;
    }
  }

  const updateCheckOutMinimum = () => {
    const nextDay = checkIn.value ? new Date(`${checkIn.value}T00:00:00`) : new Date();
    if (checkIn.value) nextDay.setDate(nextDay.getDate() + 1);
    checkOut.min = getLocalDateString(nextDay);
    if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = "";
  };
  checkIn.addEventListener("change", updateCheckOutMinimum);
  updateCheckOutMinimum();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    if (checkOut.value <= checkIn.value) {
      checkOut.setCustomValidity("Choose a check-out date after check-in.");
      checkOut.reportValidity();
      checkOut.setCustomValidity("");
      return;
    }

    const draft = {
      stayType: stayType.value,
      roomPreference: roomPreference.value.trim(),
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guestCount: guestCount.value,
      guestName: document.getElementById("guestName").value.trim(),
      guestPhone: document.getElementById("guestPhone").value.trim(),
      guestEmail: document.getElementById("guestEmail").value.trim(),
      guestNotes: document.getElementById("guestNotes").value.trim(),
    };

    try {
      window.sessionStorage.setItem(bookingDraftKey, JSON.stringify(draft));
      window.location.href = "booking-review.html";
    } catch (error) {
      message.textContent = `Could not save your request in this browser: ${error.message}. Check your browser storage settings and try again.`;
    }
  });
}

function initializeBookingReview() {
  const details = document.getElementById("bookingReviewDetails");
  if (!details) return;

  const errorMessage = document.getElementById("bookingReviewError");
  const sendLink = document.getElementById("sendBookingRequest");
  const sendEmailLink = document.getElementById("sendBookingEmail");
  const sendMessage = document.getElementById("bookingSendMessage");
  let draft;

  try {
    const savedDraft = window.sessionStorage.getItem(bookingDraftKey);
    if (savedDraft) draft = JSON.parse(savedDraft);
  } catch (error) {
    errorMessage.textContent = `Could not read your saved request: ${error.message}. Return to the form and try again.`;
    errorMessage.hidden = false;
    sendLink.hidden = true;
    sendEmailLink.hidden = true;
    return;
  }

  if (
    !draft
    || !Object.hasOwn(bookingStays, draft.stayType)
    || !draft.checkIn
    || !draft.checkOut
    || draft.checkOut <= draft.checkIn
    || !draft.guestName
    || !draft.guestPhone
  ) {
    errorMessage.textContent = "Your request details are missing or incomplete. Return to the form to enter them again.";
    errorMessage.hidden = false;
    sendLink.hidden = true;
    sendEmailLink.hidden = true;
    return;
  }

  const rows = [
    ["Accommodation", bookingStays[draft.stayType]],
    ["Preferred bedroom", draft.roomPreference || "No preference"],
    ["Check-in", draft.checkIn],
    ["Check-out", draft.checkOut],
    ["Guests", draft.guestCount],
    ["Name", draft.guestName],
    ["Phone / WhatsApp", draft.guestPhone],
    ["Email", draft.guestEmail || "Not provided"],
    ["Additional requests", draft.guestNotes || "None"],
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    row.append(term, description);
    details.append(row);
  });

  const message = [
    "Hello Spring Villa, I would like to ask about availability.",
    `Accommodation: ${bookingStays[draft.stayType]}`,
    `Preferred bedroom: ${draft.roomPreference || "No preference"}`,
    `Check-in: ${draft.checkIn}`,
    `Check-out: ${draft.checkOut}`,
    `Guests: ${draft.guestCount}`,
    `Name: ${draft.guestName}`,
    `Phone / WhatsApp: ${draft.guestPhone}`,
    `Email: ${draft.guestEmail || "Not provided"}`,
    `Additional requests: ${draft.guestNotes || "None"}`,
    "Please confirm availability, current rates, room details, and booking terms. I understand this request is not a confirmed reservation.",
  ].join("\n");
  sendLink.href = `https://wa.me/263782048004?text=${encodeURIComponent(message)}`;
  sendEmailLink.href = `mailto:springvillaguestlodge@gmail.com?subject=${encodeURIComponent("Spring Villa availability enquiry")}&body=${encodeURIComponent(message)}`;
  sendLink.addEventListener("click", () => {
    sendMessage.textContent = "WhatsApp should open with your request. Review it and tap Send to contact the lodge. Your stay is not reserved until Spring Villa confirms it.";
  });
  sendEmailLink.addEventListener("click", () => {
    sendMessage.textContent = "Your email app should open with the request addressed to springvillaguestlodge@gmail.com. Review it and send it to contact the lodge. Your stay is not reserved until Spring Villa confirms it.";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeBookingForm();
  initializeBookingReview();
});
