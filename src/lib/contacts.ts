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

const HOST_THANK_YOU_MESSAGES = [
  "🏠 via Irish Goodbye App — You absolute legend! Thanks a million for hosting — the craic was mighty and that's all down to you! Sláinte to the best host in Ireland! 🍀🥂",
  "🏠 via Irish Goodbye App — I did the Irish exit BUT I couldn't leave without thanking the host! You threw a grand party and we're all grateful! You're a star! ⭐☘️",
  "🏠 via Irish Goodbye App — Slipped away quietly, but wanted you to know — you put on one hell of a night! The hospitality would make the fairies jealous! 🧚💚",
  "🏠 via Irish Goodbye App — Gone like a leprechaun at dawn, but this one's for YOU, host with the most! Thanks for everything — it was pure class! 🌈🍻",
  "🏠 via Irish Goodbye App — Did the ol' Irish Goodbye but had to send a special thanks to the host! You made the magic happen tonight — legend! 🎉☘️",
];

const WALK_ME_HOME_MESSAGES = [
  "🚶‍♀️ via Irish Goodbye App — Hey! I'm heading home from the party and would love some company on the walk. Any chance one of ye could join me? Safety in numbers, as me granny always said! 🍀",
  "🚶‍♀️ via Irish Goodbye App — Right, I'm making me exit! Would any of ye legends fancy walking with me? A pal on the path home would be grand! ☘️💚",
  "🚶‍♀️ via Irish Goodbye App — Slipping away now but the road home is long and dark! Any takers for a wee walk together? I'll owe ye a pint! 🍻🌙",
  "🚶‍♀️ via Irish Goodbye App — The craic was mighty but this lass needs an escort home! Who's up for a stroll? Promise I'm grand company! 🧚✨",
  "🚶‍♀️ via Irish Goodbye App — Heading off now — would love a walking buddy to get home safe! Any volunteers? The fairies will bless ye! 🌈🍀",
];

const TRACK_ME_HOME_MESSAGES = [
  "📍 via Irish Goodbye App — Hey! I'm heading home solo. Would ye mind keeping an eye on me location til I'm back safe? Sharing it now — thanks a million! 🍀💚",
  "📍 via Irish Goodbye App — Right, I'm off! Sharing me location so ye know I got home in one piece. Check in on me, will ye? Sláinte! ☘️🏠",
  "📍 via Irish Goodbye App — Making the Irish exit but want someone to know I'm grand! Here's me location — give us a shout if I go off course! 🌙🍀",
];

export const getRandomMessage = () =>
  GOODBYE_MESSAGES[Math.floor(Math.random() * GOODBYE_MESSAGES.length)];

export const getRandomHostMessage = () =>
  HOST_THANK_YOU_MESSAGES[Math.floor(Math.random() * HOST_THANK_YOU_MESSAGES.length)];

export const getRandomWalkMeHomeMessage = () =>
  WALK_ME_HOME_MESSAGES[Math.floor(Math.random() * WALK_ME_HOME_MESSAGES.length)];

export const getRandomTrackMeHomeMessage = () =>
  TRACK_ME_HOME_MESSAGES[Math.floor(Math.random() * TRACK_ME_HOME_MESSAGES.length)];

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
