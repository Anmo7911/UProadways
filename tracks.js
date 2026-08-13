// Track data for the bus playlist.
// Each track plays via YouTube's search-backed embed (listType=search),
// so no hard-coded video IDs are needed — it resolves the best live match.
const TRACKS = [
  { title: "Tujhe Dekha To", artist: "Kumar Sanu, Lata Mangeshkar", moods: ["all", "nostalgic", "hitlist"] },
  { title: "Dil To Pagal Hai Title Track", artist: "Lata Mangeshkar, Udit Narayan", moods: ["all", "nostalgic"] },
  { title: "Chura Ke Dil Mera", artist: "Abhijeet, Alka Yagnik", moods: ["all", "hitlist"] },
  { title: "Pehla Nasha", artist: "Udit Narayan, Sadhana Sargam", moods: ["all", "nostalgic"] },
  { title: "Ek Ladki Ko Dekha To Aisa Laga", artist: "Kumar Sanu", moods: ["all", "nostalgic", "hitlist"] },
  { title: "Kuch Kuch Hota Hai Title Track", artist: "Udit Narayan, Alka Yagnik", moods: ["all", "hitlist"] },
  { title: "Mera Dil Bhi Kitna Pagal Hai", artist: "Kumar Sanu, Alka Yagnik", moods: ["all", "nostalgic"] },
  { title: "Taal Se Taal Mila", artist: "Udit Narayan, Alka Yagnik", moods: ["all", "workout", "hitlist"] },
  { title: "Sona Kitna Sona Hai", artist: "Kumar Sanu, Sadhana Sargam", moods: ["all", "nostalgic"] },
  { title: "Chaiyya Chaiyya", artist: "Sukhwinder Singh, Sapna Awasthi", moods: ["all", "workout", "hitlist"] },
  { title: "Tum Se Milke Dil Ka Jo Haal", artist: "Alka Yagnik, Udit Narayan", moods: ["all", "nostalgic"] },
  { title: "Raja Ko Rani Se Pyar Ho Gaya", artist: "Kumar Sanu, Alka Yagnik", moods: ["all", "nostalgic"] },
  { title: "Dil Ke Badle Sanam", artist: "Kumar Sanu, Sadhana Sargam", moods: ["all", "nostalgic"] },
  { title: "Kabhi Na Kabhi To Milogi", artist: "Kumar Sanu, Alka Yagnik", moods: ["all", "nostalgic"] },
  { title: "Yeh Kaali Kaali Aankhein", artist: "Abhijeet, Alka Yagnik", moods: ["all", "hitlist"] },
  { title: "Saathiya Tune Kya Kiya", artist: "Kumar Sanu, Alka Yagnik", moods: ["all", "nostalgic"] },
  { title: "Bholo Har Har Har", artist: "Udit Narayan, Alka Yagnik", moods: ["all", "patriotic", "workout"] },
  { title: "Vande Mataram", artist: "A.R. Rahman", moods: ["all", "patriotic"] },
  { title: "Maa Tujhe Salaam", artist: "A.R. Rahman", moods: ["all", "patriotic"] },
  { title: "Lagaan Title Track Mitwa", artist: "Udit Narayan, Chorus", moods: ["all", "patriotic", "workout"] },
  { title: "Choli Ke Peechhe", artist: "Ila Arun, Alka Yagnik", moods: ["all", "hitlist"] },
  { title: "Tanha Tanha", artist: "Alka Yagnik", moods: ["all", "nostalgic"] },
  { title: "Chunar Rang Di", artist: "Kalpana, Chorus", moods: ["all", "bhojpuri"] },
  { title: "Lollypop Lagelu", artist: "Pawan Singh", moods: ["all", "bhojpuri", "hitlist"] },
  { title: "Saiyan Superstar", artist: "Kalpana", moods: ["all", "bhojpuri"] },
  { title: "Jiya Ho Bihar Ke Lala", artist: "Manoj Tiwari", moods: ["all", "bhojpuri", "hitlist"] },
  { title: "Chhaiyya Chhaiyya (Remix)", artist: "DJ Bus Mix", moods: ["all", "workout"] },
  { title: "Aaj Blue Hai Pani Pani", artist: "Sukhwinder Singh, Alka Yagnik", moods: ["all", "workout"] },
  { title: "Radha Kaise Na Jale", artist: "Udit Narayan, Kavita Krishnamurthy", moods: ["all", "hitlist"] },
  { title: "Nimbooda Nimbooda", artist: "Kavita Krishnamurthy", moods: ["all", "workout"] },
];

// Cycle a small pool of highway/roadside photos for track thumbnails
// (placeholder art — swap for real cover art in /assets if you have it).
const THUMB_POOL = [
  "🚌", "🎶", "🛣️", "🌙", "🎤", "🪔", "🚦", "🎧",
];
