// Demo content. Times are expressed relative to "now" (minutes ago) and
// resolved at session start by buildCatalog(), so the group always feels
// alive. Everything here is fictional.

import type { Category, Creator, ReactionCounts, Series, SeriesEpisode, Sponsor } from "../types";

const unsplash = (id: string, w: number, h: number) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=faces&auto=format&q=72`;

type SeedCreator = Omit<Creator, "joinedAt" | "avatar" | "portrait"> & {
  photo: string;
  /** Negative = joins in the future (live during this session). */
  joinedMinutesAgo: number;
};

export const SEED_CREATORS: SeedCreator[] = [
  {
    id: "c_maya",
    name: "Maya Okafor",
    username: "maya",
    photo: "1531123897727-8f129e1688ce",
    role: "Novelist & screenwriter",
    category: "Creativity",
    bio: "Three novels, one film, too many notebooks. I write about families and the things they don't say.",
    verified: true,
    foundingVoice: true,
    followers: 182_400,
    joinedMinutesAgo: 13_800,
    tone: "#C9A27E",
    voice: { pitch: 1.1 },
  },
  {
    id: "c_alex",
    name: "Alex Brennan",
    username: "alexbrennan",
    photo: "1507003211169-0a1dd7228f2d",
    role: "Founder, Ledgerly",
    category: "Business",
    bio: "Started two companies, got fired from one of them. Now building the third, more carefully.",
    verified: true,
    foundingVoice: true,
    followers: 96_100,
    joinedMinutesAgo: 13_200,
    tone: "#9DA89A",
    voice: { pitch: 0.9 },
  },
  {
    id: "c_jonah",
    name: "Jonah Reyes",
    username: "jonahreyes",
    photo: "1500648767791-00dcc994a43e",
    role: "Producer",
    category: "Music",
    bio: "Grammy-nominated producer. I make records at hours that worry my mother.",
    verified: true,
    foundingVoice: true,
    followers: 241_000,
    joinedMinutesAgo: 12_500,
    tone: "#B48A6A",
    voice: { pitch: 0.8 },
  },
  {
    id: "c_theo",
    name: "Theo Laurent",
    username: "theo",
    photo: "1506794778202-cad84cf45f1d",
    role: "Chef, Maison Laurent",
    category: "Culture",
    bio: "Cook. Two restaurants in London, one in Lyon. I believe in butter and second chances.",
    verified: true,
    foundingVoice: true,
    followers: 74_300,
    joinedMinutesAgo: 11_600,
    tone: "#A89A86",
    voice: { pitch: 0.95 },
  },
  {
    id: "c_sienna",
    name: "Sienna Hart",
    username: "siennahart",
    photo: "1534528741775-53994a69daeb",
    role: "Actor",
    category: "Culture",
    bio: "Stage and screen. Currently pretending to be a 19th-century lighthouse keeper.",
    verified: true,
    foundingVoice: true,
    followers: 512_000,
    joinedMinutesAgo: 10_900,
    tone: "#C4A08A",
    voice: { pitch: 1.15 },
  },
  {
    id: "c_priya",
    name: "Priya Raman",
    username: "priya",
    photo: "1544005313-94ddf0286df2",
    role: "Olympic hurdler",
    category: "Sport",
    bio: "400m hurdles. Two Olympic finals. Professional overthinker, recovering.",
    verified: true,
    foundingVoice: true,
    followers: 133_800,
    joinedMinutesAgo: 9_800,
    tone: "#B79C84",
    voice: { pitch: 1.1, rate: 1.05 },
  },
  {
    id: "c_kwame",
    name: "Kwame Asante",
    username: "kwame",
    photo: "1531427186611-ecfd6d936c79",
    role: "Architect",
    category: "Creativity",
    bio: "I design libraries, schools and the occasional impossible staircase. Accra / London.",
    verified: true,
    foundingVoice: false,
    followers: 41_200,
    joinedMinutesAgo: 8_600,
    tone: "#8F8576",
    voice: { pitch: 0.85 },
  },
  {
    id: "c_lena",
    name: "Dr Lena Vogel",
    username: "lenavogel",
    photo: "1438761681033-6461ffad8d80",
    role: "Sleep neuroscientist",
    category: "Wellness",
    bio: "I study what your brain does while you're not watching. Spoiler: a lot.",
    verified: true,
    foundingVoice: false,
    followers: 88_900,
    joinedMinutesAgo: 7_300,
    tone: "#B6A48F",
    voice: { pitch: 1.05 },
  },
  {
    id: "c_ruby",
    name: "Ruby Chen",
    username: "rubychen",
    photo: "1524504388940-b1c1722653e1",
    role: "Comedian",
    category: "Confidence",
    bio: "Stand-up. I've bombed in four countries and killed in three. Working on the ratio.",
    verified: true,
    foundingVoice: false,
    followers: 167_500,
    joinedMinutesAgo: 5_900,
    tone: "#C7A893",
    voice: { pitch: 1.2, rate: 1.1 },
  },
  {
    id: "c_marcus",
    name: "Marcus Hale",
    username: "marcushale",
    photo: "1519085360753-af0119f7cbe7",
    role: "Former captain, now coach",
    category: "Sport",
    bio: "Fourteen seasons, one armband, zero regrets about the hair in 2009.",
    verified: true,
    foundingVoice: false,
    followers: 305_000,
    joinedMinutesAgo: 4_400,
    tone: "#99907F",
    voice: { pitch: 0.8 },
  },
  {
    id: "c_isla",
    name: "Isla Moreau",
    username: "isla",
    photo: "1517841905240-472988babdf9",
    role: "Singer-songwriter",
    category: "Music",
    bio: "Songs about leaving and coming back. New record out in the spring.",
    verified: true,
    foundingVoice: false,
    followers: 219_000,
    joinedMinutesAgo: 3_100,
    tone: "#BFA58E",
    voice: { pitch: 1.15 },
  },
  {
    id: "c_dev",
    name: "Dev Malhotra",
    username: "devm",
    photo: "1472099645785-5658abf4ff4e",
    role: "Investor, Early Light",
    category: "Business",
    bio: "I back first-time founders before it makes sense. Occasionally right.",
    verified: true,
    foundingVoice: false,
    followers: 57_600,
    joinedMinutesAgo: 2_000,
    tone: "#A3957F",
    voice: { pitch: 0.92 },
  },
  {
    id: "c_ada",
    name: "Dr Ada Nwosu",
    username: "adanwosu",
    photo: "1488426862026-3ee34a7d66df",
    role: "Psychologist",
    category: "Confidence",
    bio: "Clinical psychologist. I help people stop waiting to feel ready.",
    verified: true,
    foundingVoice: false,
    followers: 71_300,
    joinedMinutesAgo: 1_300,
    tone: "#BC9B7F",
    voice: { pitch: 1.05, rate: 0.98 },
  },
  {
    id: "c_sam",
    name: "Sam Whitaker",
    username: "samwhitaker",
    photo: "1539571696357-5a69c17a67c6",
    role: "Mountaineer",
    category: "Life",
    bio: "Eleven of the fourteen 8,000ers. Mostly I'm just good at being cold.",
    verified: true,
    foundingVoice: false,
    followers: 39_800,
    joinedMinutesAgo: 600,
    tone: "#8E8A80",
    voice: { pitch: 0.88 },
  },
  {
    id: "c_felix",
    name: "Felix Strand",
    username: "felix",
    photo: "1463453091185-61582044d556",
    role: "Ultrarunner",
    category: "Wellness",
    bio: "100-mile races, sunrise to sunrise. I run so my head goes quiet.",
    verified: true,
    foundingVoice: false,
    followers: 48_200,
    joinedMinutesAgo: 240,
    tone: "#A0937E",
    voice: { pitch: 0.9 },
  },
  {
    id: "c_noor",
    name: "Noor Haddad",
    username: "noor",
    photo: "1529626455594-4ff0802cfb7e",
    role: "Photographer",
    category: "Creativity",
    bio: "Portraits of strangers in 41 cities. I ask, they say yes, we both get braver.",
    verified: true,
    foundingVoice: false,
    followers: 64_100,
    joinedMinutesAgo: -0.5,
    tone: "#B99D86",
    voice: { pitch: 1.1 },
  },
  {
    id: "c_hana",
    name: "Hana Sato",
    username: "hanasato",
    photo: "1508214751196-bcfd4ca60f91",
    role: "Designer",
    category: "Creativity",
    bio: "Type designer and maker of very small, very calm things.",
    verified: true,
    foundingVoice: false,
    followers: 52_700,
    joinedMinutesAgo: -330,
    tone: "#B8A189",
    voice: { pitch: 1.1 },
  },
];

export function creatorFromSeed(c: SeedCreator, joinedAt: string): Creator {
  const { photo, joinedMinutesAgo: _j, ...rest } = c;
  void _j;
  return {
    ...rest,
    avatar: unsplash(photo, 240, 240),
    portrait: unsplash(photo, 900, 1150),
    joinedAt,
  };
}

type SeedNote = {
  id: string;
  creatorId: string;
  minutesAgo: number;
  title: string;
  transcript: string;
  premium?: boolean;
  earlyAccessMinutes?: number;
  sponsorId?: string;
  seriesId?: string;
};

export const SEED_NOTES: SeedNote[] = [
  {
    id: "n01",
    creatorId: "c_maya",
    minutesAgo: 13_795,
    title: "The first line",
    transcript:
      "Okay, so this is weird, talking into my phone to thousands of strangers. Hi. I'm Maya. I write novels, and the thing nobody tells you is that the first line is never the first line. You write forty pages to find the sentence that should have opened the book. So if you're stuck at the start of something, start in the middle. The beginning will find you.",
  },
  {
    id: "n02",
    creatorId: "c_alex",
    minutesAgo: 13_190,
    title: "Fired from my own company",
    transcript:
      "Seven years ago the board I hired voted me out of the company I started. Worst day of my life, genuinely. But here's what I learned. I'd built something that didn't need me, and I took that as an insult instead of a compliment. Build things that outgrow you. Then go and build the next one.",
  },
  {
    id: "n03",
    creatorId: "c_jonah",
    minutesAgo: 12_490,
    title: "The wrong note",
    transcript:
      "Best thing on my last record is a mistake. The keys player hit the wrong chord, everyone stopped, and I made them play it again, wrong, on purpose. That's the whole song now. If something sounds wrong and you can't stop thinking about it, it's probably not wrong. It's just new.",
  },
  {
    id: "n04",
    creatorId: "c_maya",
    minutesAgo: 12_100,
    title: "Boredom is a door",
    transcript:
      "Quick one. I've stopped filling every gap with my phone. In queues, on the bus, waiting for the kettle. Boredom is a door, and every idea I've liked this year walked through it. Try it today. Just stand there. It's horrible for about ninety seconds, and then it isn't.",
  },
  {
    id: "n05",
    creatorId: "c_theo",
    minutesAgo: 11_590,
    title: "Salt, then patience",
    transcript:
      "People ask me for the secret to a good sauce. Two things. Salt earlier than you think, and then patience. Most people panic at minute ten and add more stuff. Don't add more stuff. Turn the heat down, walk away, let it get there. That's true of most things I've ever cooked. And most things I've ever done.",
  },
  {
    id: "n06",
    creatorId: "c_sienna",
    minutesAgo: 10_890,
    title: "Two hundred auditions",
    transcript:
      "I did two hundred auditions before I booked anything real. Two hundred. And the shift wasn't getting better at acting. It was walking in like I'd already been cast, like I was just showing them how I'd do it. They're not judging you. They're hoping you're the answer. Let them off the hook.",
  },
  {
    id: "n07",
    creatorId: "c_alex",
    minutesAgo: 10_300,
    title: "Customers, not investors",
    transcript:
      "Unpopular founder opinion. Your investors are not your customers. I spent a whole year optimising for the next pitch deck instead of the person actually paying us. If you can only call one person this week, call a customer. Ask them what almost made them leave. Then fix that.",
  },
  {
    id: "n08",
    creatorId: "c_priya",
    minutesAgo: 9_790,
    title: "The last fifty metres",
    transcript:
      "In the four hundred hurdles, the race is decided in the last fifty metres. Everyone's tired. Everyone's form breaks. The person who wins isn't the fastest, it's whoever falls apart slowest. I train for the ugly part. Whatever you're doing, practise the bit where it hurts. That's where you'll actually live.",
  },
  {
    id: "n09",
    creatorId: "c_jonah",
    minutesAgo: 9_000,
    title: "Make it badly first",
    transcript:
      "Make it badly first. Seriously. Every demo I've made that turned into something started as the worst version of itself. The perfect version only exists in your head, and it's lying to you. Get the bad version out, then make it good. It's way easier to fix something than to imagine it.",
  },
  {
    id: "n10",
    creatorId: "c_kwame",
    minutesAgo: 8_590,
    title: "Buildings are promises",
    transcript:
      "Every building is a promise to people you'll never meet. Someone in eighty years will stand in a room I drew and feel something, cold or warm, small or held. I think about that a lot. What you make outlives your intentions. So be generous with it. Put the window where the light is.",
  },
  {
    id: "n11",
    creatorId: "c_sienna",
    minutesAgo: 8_000,
    premium: true,
    title: "The speech I didn't give",
    transcript:
      "This one's just for the people in here. At the awards last month, I had a speech written. I didn't give it. I thanked my mum, then I froze, and I walked off. And honestly, it's the most real I've ever been on a stage. I'm done performing being fine. That's it. That's the note.",
  },
  {
    id: "n12",
    creatorId: "c_lena",
    minutesAgo: 7_290,
    title: "The 3pm dip",
    transcript:
      "Neuroscience tip. That three p.m. slump isn't laziness, it's your circadian rhythm doing exactly what it should. Stop fighting it with a third coffee. Ten minutes of daylight and a short walk will do more than caffeine, and you'll actually sleep tonight. Your brain isn't broken. It's on schedule.",
  },
  {
    id: "n13",
    creatorId: "c_theo",
    minutesAgo: 6_800,
    title: "Cook for one",
    transcript:
      "Cook for one like you're cooking for someone you love. I mean it. Proper plate, sit down, no phone. For years I ate standing over the sink because it was only me. It's never only you. It's you. That should be reason enough to make it nice.",
  },
  {
    id: "n14",
    creatorId: "c_priya",
    minutesAgo: 6_200,
    title: "Nerves are fuel",
    transcript:
      "Before the Olympic final my heart rate was through the roof. My coach said, good, that's your body getting ready. Nerves and excitement are the same chemicals. You just pick the word. So next time you feel it, say I'm excited. Out loud, if you can. It sounds silly. It works.",
  },
  {
    id: "n15",
    creatorId: "c_ruby",
    minutesAgo: 5_890,
    title: "Bombing in Edinburgh",
    transcript:
      "I bombed on stage in Edinburgh. Total silence, a man left to buy crisps mid-joke. Afterwards I realised nobody remembered it but me. Nobody is thinking about your worst moment as much as you are. They're too busy thinking about theirs. Which is weirdly freeing, right?",
  },
  {
    id: "n16",
    creatorId: "c_maya",
    minutesAgo: 5_200,
    title: "Read like a thief",
    transcript:
      "If you want to write, read like a thief. Not to copy, to notice. When a sentence makes you feel something, stop and ask why. Was it the rhythm? The word they didn't use? Steal the move, not the words. That's the whole apprenticeship. Nobody's going to give you a better one.",
  },
  {
    id: "n17",
    creatorId: "c_marcus",
    minutesAgo: 4_390,
    title: "Being dropped",
    transcript:
      "I got dropped at nineteen. The academy said I wasn't quick enough. I cried in the car park, then spent two years learning to read the game so I didn't need to be quick. Being told no is information. It's not a verdict. Take what's true from it and leave the rest in the car park.",
  },
  {
    id: "n18",
    creatorId: "c_kwame",
    minutesAgo: 3_900,
    title: "Look up",
    transcript:
      "Do me a favour today. Look up. Above the shop fronts. Most cities hide their best details above eye level. Carvings, old signs, windows nobody's cleaned in decades. We walk past beauty constantly because we're looking at our feet or our phones. Look up. You'll find something.",
  },
  {
    id: "n19",
    creatorId: "c_isla",
    minutesAgo: 3_090,
    title: "The song I almost deleted",
    transcript:
      "The song that changed my life, I almost deleted. I thought it was too simple. Three chords, one idea. My neighbour heard it through the wall and knocked to ask what it was. Simple isn't the same as small. If something keeps coming back to you, don't edit it to death. Let it be simple.",
  },
  {
    id: "n20",
    creatorId: "c_lena",
    minutesAgo: 2_700,
    title: "Sleep is not a reward",
    transcript:
      "Sleep is not a reward for finishing your work. It's the thing that makes the work possible. Your brain literally rinses itself overnight. If you want to be sharper tomorrow, the most productive thing you can do tonight is stop. Put the phone in another room. That's the whole tip.",
  },
  {
    id: "n21",
    creatorId: "c_dev",
    minutesAgo: 1_990,
    title: "The question I ask every founder",
    transcript:
      "I've met over two thousand founders, and there's one question I always ask. What do you believe that sounds slightly wrong? The best answers make me uncomfortable. If your idea makes nobody uncomfortable, it's probably already taken.",
  },
  {
    id: "n22",
    creatorId: "c_ruby",
    minutesAgo: 1_700,
    title: "Say it out loud",
    transcript:
      "Confidence hack from a comedian. Say the scary thing out loud before you say it for real. In the shower, in the car, to your dog. The first time a sentence leaves your mouth is always the hardest. So make sure the real moment isn't the first time. Rehearse being brave. It counts.",
  },
  {
    id: "n23",
    creatorId: "c_jonah",
    minutesAgo: 1_500,
    title: "Studio, 4am",
    transcript:
      "It's four a.m. in the studio and I'm only just getting somewhere. Funny thing is, the first six hours were me warming up for the last one. People see the one hour. Nobody sees the six. If you've been at something all day and nothing's happened yet, maybe stay a bit longer.",
  },
  {
    id: "n24",
    creatorId: "c_ada",
    minutesAgo: 1_290,
    title: "Confidence is a verb",
    transcript:
      "I'm a psychologist and I want to say this clearly. Confidence is not a feeling you wait for. It's a verb. It's what you do before you feel ready, and the feeling turns up afterwards, a bit late, like a friend who missed the bus. Act first. The feeling follows.",
  },
  {
    id: "n25",
    creatorId: "c_marcus",
    minutesAgo: 1_100,
    title: "The armband",
    transcript:
      "When I got the captain's armband I thought I had to be the loudest voice in the dressing room. I was wrong. The best captains I played under asked the quiet lad in the corner what he thought. Leadership is mostly noticing who hasn't spoken yet.",
  },
  {
    id: "n26",
    creatorId: "c_alex",
    minutesAgo: 800,
    title: "We ship on Fridays",
    transcript:
      "We ship on Fridays. Everyone told me that's insane. But if you're scared to ship on a Friday, your problem isn't Friday. It's that you don't trust what you're shipping. Fix the fear at the root. Small changes, often. Then any day is a good day to ship.",
  },
  {
    id: "n27",
    creatorId: "c_sam",
    minutesAgo: 590,
    title: "Above 8,000 metres",
    transcript:
      "Above eight thousand metres your body is slowly dying, and you can't think straight. So every decision gets made at base camp. I set my turnaround time down there and I never renegotiate it. Make your hardest decisions when you're calm. Then trust the calm version of you.",
  },
  {
    id: "n28",
    creatorId: "c_isla",
    minutesAgo: 420,
    title: "Four thousand voice memos",
    transcript:
      "I've got four thousand voice memos on my phone. Humming, half lines, me singing into my sleeve on the tube. Almost all of them are rubbish. But every song I've ever released started as one. Capture everything. Judge later. Your future self needs raw material.",
  },
  {
    id: "n29",
    creatorId: "c_felix",
    minutesAgo: 230,
    sponsorId: "sp_northbound",
    seriesId: "s_courage",
    title: "Mile eighty",
    transcript:
      "Mile eighty of a hundred-mile race. It's three a.m. and my legs have filed a formal complaint. What gets me through isn't motivation. It's shrinking the problem. Not the finish line. The next lamppost. Then the next one. Courage is mostly refusing to look at the whole mountain at once.",
  },
  {
    id: "n30",
    creatorId: "c_priya",
    minutesAgo: 150,
    title: "Race-day breakfast",
    transcript:
      "People always ask what I eat on race day. Honestly? The same breakfast I've had for eight years. Porridge, banana, honey. Not because it's magic. Because on the biggest day of your life, you want as few decisions as possible. Save your energy for the thing that matters.",
  },
  {
    id: "n31",
    creatorId: "c_ada",
    minutesAgo: 90,
    title: "The two-minute rule",
    transcript:
      "Try the two-minute rule today. If something scares you and it would take less than two minutes, the email, the text, the question, do it right now, before your brain builds a case against it. Fear loves a delay. Don't give it one.",
  },
  {
    id: "n32",
    creatorId: "c_dev",
    minutesAgo: 45,
    earlyAccessMinutes: 225,
    title: "What I'm betting on next",
    transcript:
      "I'll tell you what I'm betting on next. Small, beautiful software made by tiny teams that people actually love. Not the biggest market. The most loyal one. Ten thousand obsessed users beat a million indifferent ones, and that's going to be the story of the next five years.",
  },
  {
    id: "n33",
    creatorId: "c_maya",
    minutesAgo: 18,
    title: "Write the bad version",
    transcript:
      "Writing the bad version today. Three hundred words of absolute nonsense, and I'm weirdly proud of it. Whatever you've been avoiding, give yourself permission for it to be awful. Awful is editable. Blank isn't.",
  },
  {
    id: "n34",
    creatorId: "c_noor",
    minutesAgo: -0.95,
    title: "Just ask",
    transcript:
      "Hi, everyone. I'm Noor. I take photographs for a living, mostly of strangers. The trick is never the camera. It's asking. Nearly everyone says yes if you ask kindly and mean it. Most of the life you want is on the other side of a question you haven't asked yet. So, ask.",
  },
  {
    id: "n35",
    creatorId: "c_hana",
    minutesAgo: -331,
    title: "Small, calm things",
    transcript:
      "Hello. I'm Hana. I design typefaces, which means I spend years on the shape of a single letter. People think that's slow. I think it's the only way anything good gets made. Slowness is not the opposite of ambition. It's how ambition survives.",
  },
];

/** Roughly how long a sentence takes to say, capped to the 30s format. */
export function speechSeconds(transcript: string) {
  const words = transcript.trim().split(/\s+/).length;
  return Math.max(12, Math.min(30, Math.round(words / 2.45)));
}

export function seedReactions(seed: number): ReactionCounts {
  const base = 120 + (seed % 900);
  return {
    "🔥": Math.round(base * 1.6),
    "❤️": Math.round(base * 1.1),
    "🙌": Math.round(base * 0.5),
    "🤯": Math.round(base * 0.3),
    "💭": Math.round(base * 0.18),
  };
}

export const SEED_SPONSORS: Sponsor[] = [
  { id: "sp_northbound", name: "Northbound", tagline: "Made for long days outside.", url: "https://example.com/northbound" },
  { id: "sp_fieldday", name: "Field Day Coffee", tagline: "Slow-roasted in Bristol.", url: "https://example.com/fieldday" },
];

export const SEED_SERIES: Series[] = [
  {
    id: "s_confidence",
    creatorId: "c_ada",
    title: "30 Days of Confidence",
    description: "Thirty notes from a clinical psychologist on acting before you feel ready. One unlocks every morning. Thirty seconds a day, for a month.",
    price: 999,
    currency: "GBP",
    billing: "one_off",
    coverImage: unsplash("1488426862026-3ee34a7d66df", 900, 1150),
    sponsorId: null,
    episodeCount: 30,
    unlockCadence: "daily",
  },
  {
    id: "s_courage",
    creatorId: "c_felix",
    title: "30 Days of Courage",
    description: "An ultrarunner on doing the hard thing anyway: one note a day, written between miles. Free to everyone.",
    price: 0,
    currency: "GBP",
    billing: "one_off",
    coverImage: unsplash("1463453091185-61582044d556", 900, 1150),
    sponsorId: "sp_northbound",
    episodeCount: 30,
    unlockCadence: "daily",
  },
  {
    id: "s_studio",
    creatorId: "c_jonah",
    title: "Studio Notes",
    description: "Voice memos from inside the sessions: what's working, what isn't, and the mistakes that turn into songs.",
    price: 499,
    currency: "GBP",
    billing: "subscription",
    coverImage: unsplash("1500648767791-00dcc994a43e", 900, 1150),
    sponsorId: null,
    episodeCount: 12,
    unlockCadence: "all",
  },
];

type Ep = [title: string, line: string];

const CONFIDENCE: Ep[] = [
  ["Confidence is a verb", "You don't wait to feel it. You do it, and the feeling arrives late."],
  ["The story you tell", "Notice the sentence you repeat about yourself. Today, change one word in it."],
  ["Borrow certainty", "Think of someone calm. Ask what they'd do next, then do that."],
  ["Small promises, kept", "Make one tiny promise to yourself and keep it. That's how trust is built."],
  ["Posture first", "Stand like the version of you that already knows. The body teaches the mind."],
  ["The two-minute rule", "If it's scary and quick, do it now, before your brain builds a case."],
  ["Say it slower", "Nervous people rush. Slow down by a third and you'll sound certain."],
  ["Rejection reps", "Ask for one thing today you expect to be refused. Collect the no."],
  ["Ask the question", "The question you're scared is stupid is the one half the room needs."],
  ["The inner commentator", "Give your critic a silly voice. It's much harder to obey a cartoon."],
  ["Comparison lies", "You're comparing your inside to someone else's highlight reel."],
  ["Take up space", "Uncross your arms. Put both feet down. You're allowed to be here."],
  ["Practise being wrong", "Say 'I was wrong' once today, on purpose. Notice nothing terrible happens."],
  ["Halfway", "Fourteen days in. Write down one thing you did that you wouldn't have a month ago."],
  ["Your evidence file", "Start a note of times you were braver than you thought. Read it on bad days."],
  ["Disagree kindly", "Confidence isn't volume. It's saying 'I see it differently' and staying warm."],
  ["The word no", "A clear no is kinder than a resentful yes. Practise one today."],
  ["Nobody is watching", "The spotlight you feel is mostly in your head. Everyone else is busy."],
  ["Take the compliment", "Next time someone praises you, just say thank you. Full stop."],
  ["Prepare, then let go", "Do the work beforehand, then trust it. Over-checking is fear in disguise."],
  ["Speak first", "In your next meeting, say something in the first five minutes."],
  ["Mistakes in public", "Make one small, harmless mistake publicly. Survive it. Repeat."],
  ["Your own approval", "Before asking what they think, decide what you think."],
  ["Brave on purpose", "Courage is a schedule, not a mood. Put one brave act in the diary."],
  ["Quiet confidence", "The most confident person in the room is often the one listening."],
  ["Hard conversations", "Open with what you want for them, not what you want from them."],
  ["When it wobbles", "Confidence dips. That's not failure, that's weather."],
  ["Who you're becoming", "Describe yourself a year from now. Act like that person for one hour."],
  ["Teach it", "Explain one thing from this month to a friend. Teaching makes it yours."],
  ["Keep the verb", "Thirty days. The feeling followed, didn't it? Keep doing the verb."],
];

const COURAGE: Ep[] = [
  ["The next lamppost", "Don't look at the summit. Look at the next lamppost."],
  ["Fear is a compass", "The thing that scares you most usually points somewhere worth going."],
  ["Cold water", "Thirty seconds of cold water. Proof you can choose discomfort."],
  ["Before you're ready", "Nobody starts ready. Starting is how you get ready."],
  ["The first mile lies", "The first mile always feels terrible. It's lying about the rest."],
  ["Pack light", "Carry less. Fewer excuses fit in a smaller bag."],
  ["Run in the rain", "Bad weather is just weather. Go anyway."],
  ["Say it first", "Be the first to apologise, the first to say what everyone's thinking."],
  ["Turnaround time", "Courage includes knowing when to turn back. Decide it early."],
  ["Hill repeats", "Do the hard part twice. The second time is where you grow."],
  ["Night stage", "Everything is scarier in the dark. Keep moving and the sun comes."],
  ["Blisters", "Small problems become big ones if you ignore them. Stop and fix the sock."],
  ["Crew", "Brave people still have a crew. Ask for help early."],
  ["Halfway", "Fifteen days. You're further than you think and less tired than you feel."],
  ["The wall", "When you hit it, eat something and walk for five minutes. Then run."],
  ["Unknown trail", "Take a route you've never taken. Get a little lost on purpose."],
  ["Altitude", "Go slower than your ego wants. You'll get higher."],
  ["Dawn", "Watch a sunrise this week. You'll remember why you started."],
  ["Finish lines", "Most finish lines are arbitrary. Choose yours honestly."],
  ["Easy days", "Courage needs rest. An easy day is part of the plan."],
  ["DNF", "Not finishing isn't failing. Not starting is."],
  ["Headwind", "Tuck in, shorten the stride, keep going."],
  ["Long way round", "The shortcut is usually the long way round."],
  ["Lonely miles", "Some miles you run alone. They still count."],
  ["Downhill", "Going down is harder than it looks. Respect the easy-looking parts."],
  ["Ask the stranger", "Ask a stranger for directions today. Small brave things add up."],
  ["Heat", "Slow down before you have to. That's experience, not weakness."],
  ["Last climb", "The last climb is always the steepest in your head."],
  ["Kick", "Leave something for the end. Then use all of it."],
  ["Home", "Thirty days. Keep the lampposts. There's always a next one."],
];

const STUDIO: Ep[] = [
  ["Kick drum day", "Six hours on a kick drum. Worth it."],
  ["The scratch vocal", "The guide vocal was better than the real take. Again."],
  ["Wrong chord, part two", "It happened again. We kept it."],
  ["Silence", "Muted everything but the bass. Found the song."],
  ["Reference tracks", "Stop comparing. Start listening."],
  ["The session that died", "Sometimes nothing comes. Go home."],
  ["Tape", "Bounced it to tape. It sounds older and truer."],
  ["Feedback", "Played it for my mum. She hated it. Keeping it."],
  ["The bridge", "Every song has a bridge it doesn't need."],
  ["Collaborators", "Bring in someone who'll disagree with you."],
  ["Final mix", "There is no final mix. Just the one you let go of."],
  ["Out now", "It's out. It's not mine any more. That's the point."],
];

export const SEED_EPISODES: Omit<SeriesEpisode, "waveformData">[] = [
  ...CONFIDENCE.map(([title, line], i) => ep("s_confidence", i, title, line)),
  ...COURAGE.map(([title, line], i) => ep("s_courage", i, title, line)),
  ...STUDIO.map(([title, line], i) => ep("s_studio", i, title, line)),
];

function ep(seriesId: string, i: number, title: string, line: string) {
  const transcript = `Day ${i + 1}. ${title}. ${line} That's it for today. I'll see you tomorrow.`;
  return {
    id: `${seriesId}_e${String(i + 1).padStart(2, "0")}`,
    seriesId,
    day: i + 1,
    title,
    transcript,
    duration: speechSeconds(transcript),
    audioUrl: null,
  };
}

export const ONBOARDING_INTERESTS: Category[] = ["Creativity", "Business", "Music", "Sport", "Life", "Confidence", "Culture", "Wellness"];

/** Baseline audience size for the "listening right now" line. */
export const LISTENING_BASE = 4281;
