const accommodationOptions = {
  "standard-room": {
    name: "Cozy lodge rooms",
    description: "Comfortable lodging with modern essentials and a welcoming atmosphere.",
    rate: "$75 USD / night",
    images: ["Bedroom2.jpg", "IMG_9526.jpg.jpeg"],
  },
  "family-unit": {
    name: "Family-friendly comfort",
    description: "A family-friendly accommodation option. Contact the lodge to confirm its layout, capacity, amenities, and current rate.",
    rate: "$100 USD / night",
    images: ["Bedroom3.jpg", "IMG_9530.jpg.jpeg", "IMG_9531.jpg.jpeg", "IMG_9533.jpg.jpeg"],
  },
  campsite: {
    name: "Camp beneath the stars",
    description: "A campsite option at Spring Villa. Contact the lodge to confirm facilities, availability, and current rates.",
    rate: "$90 USD / night",
    images: ["IMG_9502.jpg.jpeg"],
  },
};

const stayId = new URLSearchParams(window.location.search).get("stay") || "standard-room";
const stay = accommodationOptions[stayId] || accommodationOptions["standard-room"];

function setMinimumDate(input, minimum) {
  if (input) input.min = minimum;
}

function renderAccommodation() {
  const title = document.getElementById("stayName");
  if (!title) return;

  document.title = `${stay.name} | Spring Villa Guest Lodge & Campsite`;
  title.textContent = stay.name;
  document.getElementById("stayDescription").textContent = stay.description;
  document.querySelector(".quote-placeholder").textContent = `Displayed rate: ${stay.rate}. Confirm the pricing unit, availability, and any applicable charges with the lodge.`;

  const hero = document.getElementById("detailHero");
  const thumbnails = document.getElementById("detailThumbnails");
  hero.src = stay.images[0];
  hero.alt = `${stay.name} at Spring Villa`;
  thumbnails.replaceChildren();
  stay.images.forEach((src, index) => {
    const button = document.createElement("button");
    const image = document.createElement("img");
    button.type = "button";
    button.className = "thumbnail-button";
    button.setAttribute("aria-label", `Show photo ${index + 1}`);
    image.src = src;
    image.alt = `${stay.name} photo ${index + 1}`;
    button.append(image);
    button.addEventListener("click", () => {
      hero.src = src;
      hero.alt = `${stay.name}, photo ${index + 1}`;
    });
    thumbnails.append(button);
  });

  document.getElementById("viewAllPhotos").addEventListener("click", () => {
    thumbnails.scrollIntoView({ behavior: "smooth", block: "center" });
    thumbnails.querySelector("button")?.focus();
  });

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const checkIn = document.getElementById("checkIn");
  const checkOut = document.getElementById("checkOut");
  setMinimumDate(checkIn, todayString);
  setMinimumDate(checkOut, todayString);
  checkIn.addEventListener("change", () => {
    const nextDay = new Date(`${checkIn.value}T00:00:00`);
    nextDay.setDate(nextDay.getDate() + 1);
    setMinimumDate(checkOut, `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, "0")}-${String(nextDay.getDate()).padStart(2, "0")}`);
    if (checkOut.value && checkOut.value <= checkIn.value) checkOut.value = "";
  });

  document.getElementById("stayRequestForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    if (!checkIn.value || !checkOut.value || checkOut.value <= checkIn.value) {
      document.getElementById("bookingMessage").textContent = "Choose a check-out date after your check-in date.";
      return;
    }

    const params = new URLSearchParams({
      stay: stayId,
      checkIn: checkIn.value,
      checkOut: checkOut.value,
      guests: document.getElementById("guestCount").value,
    });
    window.location.href = `booking.html?${params}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderAccommodation();
});
