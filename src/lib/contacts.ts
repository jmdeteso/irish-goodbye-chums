const GOODBYE_MESSAGES = [
  "Sure look, I had a grand time! Sláinte! 🍀",
  "Off like a leprechaun in the night! Had a mighty craic! ☘️",
  "Slipped away like the mist over the hills! Miss ye already! 🌈",
  "Did the ol' Irish Goodbye — but me heart stays! 💚",
  "Gone before the last round, but the memories stay forever! 🍻",
  "Vanished like a pot of gold — but the fun was real! ✨",
  "Pulled a classic Irish exit! Thanks for the craic! 🎶",
  "Tiptoed out like a wee fairy — had a brilliant time! 🧚",
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
