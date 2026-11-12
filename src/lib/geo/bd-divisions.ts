// Bangladesh's eight divisions and their districts (Bangladesh Bureau of Statistics), for the region tree's last level
// (accessibility core, step 4). District names are spelled as in public/geo/bd-districts.json (geoBoundaries); the
// test checks that every district there belongs to exactly one division. Names only: a division's place on the map
// is the mean of its districts' label points, computed from the geo file.

export interface Division {
  id: string;
  name: string;
  nameBn: string;
  districts: readonly string[];
}

export const BD_DIVISIONS: readonly Division[] = [
  { id: "barishal", name: "Barishal", nameBn: "বরিশাল", districts: ["Barguna", "Barisal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur"] },
  {
    id: "chattogram",
    name: "Chattogram",
    nameBn: "চট্টগ্রাম",
    districts: ["Bandarban", "Brahamanbaria", "Chandpur", "Chittagong", "Comilla", "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali", "Rangamati"],
  },
  {
    id: "dhaka",
    name: "Dhaka",
    nameBn: "ঢাকা",
    districts: ["Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur", "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari", "Shariatpur", "Tangail"],
  },
  {
    id: "khulna",
    name: "Khulna",
    nameBn: "খুলনা",
    districts: ["Bagerhat", "Chuadanga", "Jessore", "Jhenaidah", "Khulna", "Kushtia", "Magura", "Meherpur", "Narail", "Satkhira"],
  },
  { id: "mymensingh", name: "Mymensingh", nameBn: "ময়মনসিংহ", districts: ["Jamalpur", "Mymensingh", "Netrakona", "Sherpur"] },
  { id: "rajshahi", name: "Rajshahi", nameBn: "রাজশাহী", districts: ["Bogra", "Joypurhat", "Naogaon", "Natore", "Nawabganj", "Pabna", "Rajshahi", "Sirajganj"] },
  { id: "rangpur", name: "Rangpur", nameBn: "রংপুর", districts: ["Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari", "Panchagarh", "Rangpur", "Thakurgaon"] },
  { id: "sylhet", name: "Sylhet", nameBn: "সিলেট", districts: ["Habiganj", "Maulvibazar", "Sunamganj", "Sylhet"] },
];
