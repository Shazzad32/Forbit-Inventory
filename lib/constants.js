export const DEVICE_TYPES = ["Voice", "Non_Voice"];
export const SEND_TO = ["Store", "Retail", "Rangs", "Return"];
export const PURPOSES = ["Facebook", "Replace", "Reference"];

// Each list page (store / retail / rangs / return) is described by this config.
// `match` is the MongoDB filter, `columns` is what the table shows.
export const SECTIONS = {
  store: {
    title: "Store",
    subtitle: "Devices in stock, ready to send out",
    sendTo: "Store",
    editForm: "send",
    match: { send_to: "Store" },
    sort: { insert_date: -1, _id: -1 },
    columns: [
      { key: "device_id", label: "Device ID", type: "id" },
      { key: "device_model", label: "Model" },
      { key: "from", label: "From" },
      { key: "device_type", label: "Type", type: "badge" },
      { key: "insert_date", label: "Insert date", type: "date" },
    ],
    quick: [
      { to: "Retail", label: "To Retail", form: "send" },
      { to: "Rangs", label: "To Rangs", form: "send" },
    ],
  },
  retail: {
    title: "Retail",
    subtitle: "Devices with technicians that are not sold yet",
    sendTo: "Retail",
    editForm: "sell",
    match: { send_to: "Retail", is_complete: { $ne: true } },
    sort: { insert_date: -1, _id: -1 },
    columns: [
      { key: "device_id", label: "Device ID", type: "id" },
      { key: "device_model", label: "Model" },
      { key: "from", label: "From" },
      { key: "device_type", label: "Type", type: "badge" },
      { key: "issue_by", label: "Issued by" },
      { key: "district", label: "District" },
      { key: "insert_date", label: "Insert date", type: "date" },
      { key: "sending_date", label: "Sending date", type: "date" },
    ],
    quick: [{ to: "Return", label: "Return", form: "return" }],
  },
  rangs: {
    title: "Rangs",
    subtitle: "Devices at the Rangs workshops",
    sendTo: "Rangs",
    editForm: "send",
    match: { send_to: "Rangs" },
    sort: { insert_date: -1, _id: -1 },
    columns: [
      { key: "device_id", label: "Device ID", type: "id" },
      { key: "device_model", label: "Model" },
      { key: "device_type", label: "Type", type: "badge" },
      { key: "from", label: "From" },
      { key: "workshop", label: "Workshop" },
      { key: "insert_date", label: "Insert date", type: "date" },
      { key: "sending_date", label: "Sending date", type: "date" },
    ],
    quick: [],
  },
  return: {
    title: "Returns",
    subtitle: "Devices sent back with a problem",
    sendTo: "Return",
    editForm: "send",
    match: { send_to: "Return" },
    sort: { sending_date: -1, _id: -1 },
    columns: [
      { key: "device_id", label: "Device ID", type: "id" },
      { key: "device_model", label: "Model" },
      { key: "device_type", label: "Type", type: "badge" },
      { key: "from", label: "From" },
      { key: "issue_by", label: "Issued by" },
      { key: "problem", label: "Problem" },
      { key: "sending_date", label: "Date", type: "date" },
    ],
    quick: [],
  },
};

// Where a device can be. `color` matches the dashboard (store blue, retail orange, rangs green, return pink).
export const LOCATIONS = {
  Store: { icon: "store", color: "var(--c-store)", note: "In stock" },
  Retail: { icon: "retail", color: "var(--c-retail)", note: "With a technician" },
  Rangs: { icon: "rangs", color: "var(--c-rangs)", note: "At a workshop" },
  Return: { icon: "return", color: "var(--c-return)", note: "Came back with a problem" },
};

export const SOLD_COLUMNS = [
  { key: "device_id", label: "Device ID", type: "id" },
  { key: "device_model", label: "Model" },
  { key: "device_type", label: "Type", type: "badge" },
  { key: "issue_by", label: "Issued to" },
  { key: "district", label: "District" },
  { key: "install_purpose", label: "Purpose" },
  { key: "device_price", label: "Price", type: "money" },
  { key: "install_date", label: "Install date", type: "date" },
];

export const DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barisal", "Bhola", "Bogra", "Brahmanbaria",
  "Chandpur", "Chapai Nawabganj", "Chittagong", "Chuadanga", "Comilla", "Cox's Bazar",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jessore", "Jhalokati", "Jhenaidah", "Joypurhat",
  "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Maulvibazar", "Meherpur",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon",
];
