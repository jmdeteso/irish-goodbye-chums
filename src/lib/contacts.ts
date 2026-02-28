const GOODBYE_MESSAGES = [
  "👋 via Irish Goodbye App — Sure look, I had a grand time with ye! Slipped away but didn't want to leave without saying cheers! Sláinte! 🍀",
  "👋 via Irish Goodbye App — I pulled the classic Irish exit, but this wee leprechaun wanted you to know I had a mighty craic! ☘️",
  "👋 via Irish Goodbye App — Slipped away like the mist over the hills! Didn't want ye thinking I vanished — miss ye already! 🌈",
  "👋 via Irish Goodbye App — Did the ol' Irish Goodbye but me heart stays with ye! Had an absolute blast! 💚",
  "👋 via Irish Goodbye App — Gone before the last round, but the memories stay forever! This leprechaun is sending ye love! 🍻",
  "👋 via Irish Goodbye App — Vanished like a pot of gold, but the fun was real! Download Irish Goodbye so you can ghost me back! ✨",
  "👋 via Irish Goodbye App — Pulled a classic Irish exit! Thanks for the craic — this wee fella wanted to say goodbye for me! 🎶",
  "👋 via Irish Goodbye App — Tiptoed out like a wee fairy, but had a brilliant time with ye! Cheers! 🧚",
];

export const getRandomMessage = () =>
  GOODBYE_MESSAGES[Math.floor(Math.random() * GOODBYE_MESSAGES.length)];

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  distance: number; // meters
  pinged: boolean;
}

export const MOCK_CONTACTS: Contact[] = [
  { id: "1", name: "Siobhán Murphy", avatar: "SM", distance: 12, pinged: false },
  { id: "2", name: "Liam O'Brien", avatar: "LO", distance: 45, pinged: false },
  { id: "3", name: "Aoife Kelly", avatar: "AK", distance: 8, pinged: false },
  { id: "4", name: "Declan Walsh", avatar: "DW", distance: 120, pinged: false },
  { id: "5", name: "Niamh Fitzgerald", avatar: "NF", distance: 30, pinged: false },
  { id: "6", name: "Ciarán Byrne", avatar: "CB", distance: 200, pinged: false },
  { id: "7", name: "Róisín Doyle", avatar: "RD", distance: 65, pinged: false },
  { id: "8", name: "Paddy O'Sullivan", avatar: "PO", distance: 15, pinged: false },
];
