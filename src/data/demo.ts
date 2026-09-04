export type BloodType = "O+" | "A+" | "B+" | "AB+" | "O-" | "A-" | "B-" | "AB-";
export type Urgency = "CRITICAL" | "URGENT" | "STANDARD";

export const demoAccounts = [
  { role: "Coordinator", name: "Thiri Win", detail: "Yangon Community Blood Network", href: "/workspace" },
  { role: "Donor", name: "Ko Min Htet", detail: "O+ · Sanchaung", href: "/donor" },
  { role: "Individual", name: "May Thazin", detail: "Request help for a relative", href: "/requests/new?from=individual" },
] as const;

export const hospitals = [
  { id: 1, name: "Yangon General Hospital", township: "Lanmadaw", latitude: 16.7792, longitude: 96.1494, need: "O+", urgency: "CRITICAL" as Urgency },
  { id: 2, name: "Thingangyun Sanpya Hospital", township: "Thingangyun", latitude: 16.8312, longitude: 96.1991, need: "B+", urgency: "URGENT" as Urgency },
  { id: 3, name: "North Okkalapa General Hospital", township: "North Okkalapa", latitude: 16.9073, longitude: 96.1568, need: "A-", urgency: "STANDARD" as Urgency },
  { id: 4, name: "Insein General Hospital", township: "Insein", latitude: 16.8897, longitude: 96.1051, need: "AB+", urgency: "URGENT" as Urgency },
] as const;

export const demoRequests = [
  { id: "BR-1048", initials: "M.T.", hospital: "Yangon General Hospital", bloodType: "O+", units: 2, urgency: "CRITICAL" as Urgency, status: "Inviting", accepted: 1, invited: 8 },
  { id: "BR-1047", initials: "K.N.", hospital: "Thingangyun Sanpya Hospital", bloodType: "B+", units: 1, urgency: "URGENT" as Urgency, status: "Confirmed", accepted: 2, invited: 5 },
  { id: "BR-1046", initials: "—", hospital: "Insein General Hospital", bloodType: "AB+", units: 2, urgency: "STANDARD" as Urgency, status: "Closed", accepted: 2, invited: 6 },
] as const;

export const candidates = [
  { id: "D-208", bloodType: "O+", township: "Sanchaung area", distance: "2–4 km", availability: "Available now", lastDonation: "4+ months ago", selected: true },
  { id: "D-154", bloodType: "O+", township: "Ahlone area", distance: "4–6 km", availability: "Available today", lastDonation: "6+ months ago", selected: true },
  { id: "D-311", bloodType: "O+", township: "Kamayut area", distance: "4–6 km", availability: "Available now", lastDonation: "3+ months ago", selected: false },
  { id: "D-092", bloodType: "O+", township: "Tamwe area", distance: "6–10 km", availability: "Check first", lastDonation: "Unknown", selected: false },
] as const;

export const donorInvitations = [
  { id: "INV-82", hospital: "Yangon General Hospital", township: "Lanmadaw", bloodType: "O+", urgency: "CRITICAL" as Urgency, time: "Today · before 3:00 PM", status: "Awaiting response" },
  { id: "INV-74", hospital: "Insein General Hospital", township: "Insein", bloodType: "O+", urgency: "STANDARD" as Urgency, time: "Aug 28", status: "Declined" },
] as const;

export const roster = [
  { name: "Ko Min Htet", bloodType: "O+", township: "Sanchaung", availability: "Available" },
  { name: "Nandar Hlaing", bloodType: "B+", township: "Thingangyun", availability: "Today only" },
  { name: "Aung Khant", bloodType: "A-", township: "North Okkalapa", availability: "Paused" },
  { name: "Su Myat Noe", bloodType: "AB+", township: "Insein", availability: "Available" },
] as const;
